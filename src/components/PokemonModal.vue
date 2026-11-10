<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Pokemon, EvolutionStep } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeColor, getTypeGradient } from "@/utils/typeColors";
import { getTypeLabel, pickLocalizedEntry, pickFlavorText, getFormVersions } from "@/utils/pokemonI18n";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { fetchPokemonSpecies, type PokeAPISpecies } from "@/services/pokeapi";
import { loadRegionalForm, loadMegaEvolutionData, loadGigamaxData } from "@/services/pokeapi-transform";

const { t } = useTranslation();
const { getPokemonById } = usePokemon();

const props = defineProps<{
  pokemon: Pokemon | null;
  language: Language;
  isShiny: boolean;
  isOpen: boolean;
  enrichPokemon: (pokemon: Pokemon) => Promise<Pokemon>;
}>();

const emit = defineEmits<{
  close: [];
  navigate: [pokedexId: number];
}>();

const modalRef = ref<HTMLElement | null>(null);
const isOpenRef = ref(false);
const enrichedPokemon = ref<Pokemon | null>(null);
const species = ref<PokeAPISpecies | null>(null);
const isLoadingDetails = ref(false);
const currentFormData = ref<Pokemon | null>(null);
const isLoadingForm = ref(false);
const localIsShiny = ref(props.isShiny);

type FormType = 'normal' | 'regional' | 'mega' | 'gigamax';

interface PokemonForm {
  type: FormType;
  label: string;
  index?: number;
}

const NORMAL_FORM = { type: 'normal' as const };
const selectedForm = ref<{ type: FormType; index?: number }>({ ...NORMAL_FORM });

// Guards against out-of-order async responses when the user switches Pokémon/forms quickly
let detailsRequestId = 0;
let formRequestId = 0;

const displayPokemon = computed(() => currentFormData.value || enrichedPokemon.value || props.pokemon);

useFocusTrap(modalRef, isOpenRef, () => emit("close"));

// Texts that depend on the language are derived from the loaded species so they
// follow language changes without any new request
const pokemonDescription = computed(() => {
  const { type, index } = selectedForm.value;
  const region = type === 'regional' && index !== undefined ? enrichedPokemon.value?.formes?.[index]?.region : undefined;
  const variety = type === 'mega' && index !== undefined ? enrichedPokemon.value?.evolution?.mega?.[index]?.variety : undefined;
  const entry = pickFlavorText(species.value?.flavor_text_entries, props.language, getFormVersions(type, region, variety));
  return entry?.flavor_text.replace(/[\n\f]/g, ' ') ?? '';
});

const pokemonCategory = computed(
  () => pickLocalizedEntry(species.value?.genera, props.language)?.genus || displayPokemon.value?.category || ''
);

const loadEnrichedDetails = async (pokemon: Pokemon) => {
  const requestId = ++detailsRequestId;
  formRequestId++;
  isLoadingDetails.value = true;
  isLoadingForm.value = false;
  currentFormData.value = null;
  enrichedPokemon.value = null;
  species.value = null;
  selectedForm.value = { ...NORMAL_FORM };
  localIsShiny.value = props.isShiny;

  const speciesPromise = fetchPokemonSpecies(pokemon.pokedex_id).catch((error) => {
    console.error('Error loading description:', error);
    return null;
  });

  try {
    const enriched = await props.enrichPokemon(pokemon);
    if (requestId !== detailsRequestId) return;
    enrichedPokemon.value = enriched;
  } catch (error) {
    console.error("Error loading Pokemon details:", error);
    if (requestId !== detailsRequestId) return;
    enrichedPokemon.value = pokemon;
  }

  const loadedSpecies = await speciesPromise;
  if (requestId !== detailsRequestId) return;
  species.value = loadedSpecies;
  isLoadingDetails.value = false;
};

// Reload whenever the modal opens OR the displayed Pokémon changes while it is open
// (e.g. navigating through the evolution buttons)
watch(
  () => [props.isOpen, props.pokemon?.pokedex_id] as const,
  ([open]) => {
    isOpenRef.value = open;
    if (open && props.pokemon) {
      loadEnrichedDetails(props.pokemon);
    } else if (!open) {
      detailsRequestId++;
      formRequestId++;
    }
  },
  { immediate: true }
);

const getMegaVariant = (variety?: string): string => {
  const match = variety?.match(/-mega-([xyz])$/);
  return match ? match[1].toUpperCase() : 'mega';
};

const loadAlternativeForm = async (form: { type: FormType; index?: number }) => {
  const base = enrichedPokemon.value;
  if (!base) return;

  const requestId = ++formRequestId;
  isLoadingForm.value = true;

  try {
    let result: Pokemon | null = null;

    if (form.type === 'regional' && form.index !== undefined) {
      const region = base.formes?.[form.index]?.region;
      const baseSpecies = region ? (species.value ?? await fetchPokemonSpecies(base.pokedex_id)) : null;
      if (region && baseSpecies) {
        result = await loadRegionalForm(base, region, baseSpecies);
      }
    } else if (form.type === 'mega' && form.index !== undefined) {
      const variety = base.evolution?.mega?.[form.index]?.variety;
      result = await loadMegaEvolutionData(base, getMegaVariant(variety), variety);
    } else if (form.type === 'gigamax') {
      result = await loadGigamaxData(base);
    }

    if (requestId !== formRequestId) return;
    currentFormData.value = result;
  } catch (error) {
    console.error("Error loading form data:", error);
    if (requestId === formRequestId) currentFormData.value = null;
  } finally {
    if (requestId === formRequestId) isLoadingForm.value = false;
  }
};

const selectForm = (form: PokemonForm) => {
  selectedForm.value = { type: form.type, index: form.index };
  if (form.type === 'normal') {
    formRequestId++;
    isLoadingForm.value = false;
    currentFormData.value = null;
  } else {
    loadAlternativeForm(selectedForm.value);
  }
};

const isSelectedForm = (form: PokemonForm) =>
  selectedForm.value.type === form.type && selectedForm.value.index === form.index;

const MEGA_LETTERS = ['X', 'Y', 'Z'];

const availableForms = computed(() => {
  const base = enrichedPokemon.value;
  if (!base) return [];

  const forms: PokemonForm[] = [{ type: 'normal', label: t('modal.normalForm') }];

  base.formes?.forEach((forme, index) => {
    forms.push({
      type: 'regional',
      label: `${t('modal.form')} ${forme.region.charAt(0).toUpperCase() + forme.region.slice(1)}`,
      index,
    });
  });

  const megas = base.evolution?.mega ?? [];
  megas.forEach((mega, index) => {
    const variant = /-mega-([xyz])$/.exec(mega.variety ?? '')?.[1]?.toUpperCase()
      ?? /\s([XYZ])$/.exec(mega.orbe)?.[1]
      ?? (megas.length > 1 ? MEGA_LETTERS[index] : undefined);
    forms.push({
      type: 'mega',
      label: variant ? `${t('modal.megaEvolution')} ${variant}` : t('modal.megaEvolution'),
      index,
    });
  });

  if (base.sprites.gmax) {
    forms.push({ type: 'gigamax', label: t('modal.gigamax') });
  }

  return forms;
});

// Evolution names/conditions come from the API as slugs/French text: resolve them in the current language
const evolutionName = (step: EvolutionStep): string =>
  getPokemonById(step.pokedex_id)?.name[props.language] ?? step.name;

const evolutionCondition = (step: EvolutionStep): string =>
  step.conditionKey ? t(step.conditionKey as any, step.conditionVars) : step.condition;

const abilityName = (talent: { name: string; names?: Record<Language, string> }): string =>
  talent.names?.[props.language] ?? talent.name;

const currentFormSprite = computed(() => {
  if (!displayPokemon.value) return "";

  const shiny = localIsShiny.value;

  if (selectedForm.value.type === 'mega' && selectedForm.value.index !== undefined && enrichedPokemon.value?.evolution?.mega) {
    const mega = enrichedPokemon.value.evolution.mega[selectedForm.value.index];
    if (!mega) return "";
    return shiny && mega.sprites.shiny ? mega.sprites.shiny : mega.sprites.regular;
  }

  if (selectedForm.value.type === 'gigamax' && enrichedPokemon.value?.sprites.gmax) {
    if (typeof enrichedPokemon.value.sprites.gmax === 'string') {
      return enrichedPokemon.value.sprites.gmax;
    } else {
      return shiny && enrichedPokemon.value.sprites.gmax.shiny
        ? enrichedPokemon.value.sprites.gmax.shiny
        : enrichedPokemon.value.sprites.gmax.regular;
    }
  }

  if (!displayPokemon.value.sprites) return "";
  return shiny && displayPokemon.value.sprites.shiny
    ? displayPokemon.value.sprites.shiny
    : displayPokemon.value.sprites.regular;
});

watch(() => props.isShiny, (newVal) => {
  localIsShiny.value = newVal;
});

const spriteUrl = computed(() => currentFormSprite.value);

const toggleShiny = () => {
  if (displayPokemon.value?.sprites.shiny) {
    localIsShiny.value = !localIsShiny.value;
  }
};
const headerGradient = computed(() => {
  if (!displayPokemon.value?.types || displayPokemon.value.types.length === 0) {
    return "from-pokedex-red to-pokedex-red-dark";
  }
  
  const type1 = displayPokemon.value.types[0].name;
  const type2 = displayPokemon.value.types.length > 1 ? displayPokemon.value.types[1].name : undefined;
  
  return getTypeGradient(type1, type2);
});

const getEvolutionSprite = (evolution: EvolutionStep): string => {
  const id = evolution.varietyId || evolution.pokedex_id;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
};
const navigateToEvolution = (pokedexId: number) => {
  emit("navigate", pokedexId);
};

const closeModal = () => {
  emit("close");
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen && displayPokemon"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`modal-title-${displayPokemon.pokedex_id}`"
      aria-describedby="modal-description"
      @click="handleBackdropClick"
    >
      <div
        ref="modalRef"
        class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div
          :class="[
            'sticky top-0 bg-gradient-to-r p-6 rounded-t-3xl flex justify-between items-center',
            headerGradient
          ]"
        >
          <div class="flex items-center gap-4">
            <h2 :id="`modal-title-${displayPokemon.pokedex_id}`" class="text-white text-3xl font-bold">
              {{ displayPokemon.name[language] }}
            </h2>
            <span class="text-white/80 text-lg" :aria-label="t('modal.pokedexNumber', { id: displayPokemon.pokedex_id })">
              #{{ displayPokemon.pokedex_id.toString().padStart(3, "0") }}
            </span>
          </div>
          <button
            @click="closeModal"
            class="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            :aria-label="t('aria.closeModal')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Boutons de sélection de forme -->
        <div v-if="availableForms.length > 1" class="px-6 pt-4">
          <div class="flex flex-wrap gap-2 w-full">
            <button
              v-for="(form, index) in availableForms"
              :key="index"
              @click="selectForm(form)"
              :class="[
                'flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/50',
                isSelectedForm(form)
                  ? 'bg-white text-pokedex-red shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              ]"
            >
              {{ form.label }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div id="modal-description" class="p-6 space-y-6">
          <!-- Indicateur de chargement des détails -->
          <div v-if="isLoadingDetails || isLoadingForm" class="flex justify-center items-center py-8">
            <div class="flex flex-col items-center gap-4">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p class="text-white/80 text-sm">
                {{ isLoadingForm ? t("loading.form") : t("loading.details") }}
              </p>
            </div>
          </div>

          <!-- Image et infos de base -->
          <div v-else class="flex flex-col md:flex-row gap-6 items-center">
            <!-- Image -->
            <div class="flex-shrink-0">
              <div 
                class="bg-white/10 rounded-2xl p-6 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all relative group"
                @click="toggleShiny"
                :title="displayPokemon.sprites.shiny ? (localIsShiny ? t('aria.clickNormal') : t('aria.clickShiny')) : t('aria.noShiny')"
              >
                <img
                  :src="spriteUrl"
                  :alt="displayPokemon.name[language]"
                  class="h-48 w-48 object-contain transition-transform group-hover:scale-105"
                />
                <div v-if="displayPokemon.sprites.shiny" class="absolute top-2 right-2">
                  <span v-if="localIsShiny" class="text-2xl animate-pulse">✨</span>
                  <span v-else class="text-white/50 text-sm group-hover:text-white/80 transition-colors">✨</span>
                </div>
              </div>
            </div>

            <!-- Infos de base -->
            <div class="flex-1 space-y-4 w-full">
              <!-- Types -->
              <div v-if="displayPokemon.types">
                <h3 class="text-white/60 text-sm font-semibold mb-2">{{ t("modal.types") }}</h3>
                <div class="flex gap-2">
                  <span
                    v-for="type in displayPokemon.types"
                    :key="type.name"
                    :class="[
                      getTypeColor(type.name),
                      'px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md',
                    ]"
                  >
                    {{ getTypeLabel(type.name, language) }}
                  </span>
                </div>
              </div>

              <!-- Catégorie -->
              <div>
                <h3 class="text-white/60 text-sm font-semibold mb-1">
                  {{ t("modal.category") }}
                </h3>
                <p class="text-white text-lg">{{ pokemonCategory }}</p>
              </div>

              <!-- Description -->
              <div v-if="pokemonDescription">
                <h3 class="text-white/60 text-sm font-semibold mb-1">
                  {{ t("modal.description") }}
                </h3>
                <p class="text-white/90 text-sm leading-relaxed">{{ pokemonDescription }}</p>
              </div>

              <!-- Taille et poids -->
              <div class="grid grid-cols-2 gap-4">
                <div v-if="displayPokemon.height">
                  <h3 class="text-white/60 text-sm font-semibold mb-1">
                    {{ t("modal.height") }}
                  </h3>
                  <p class="text-white text-lg">{{ displayPokemon.height }}</p>
                </div>
                <div v-if="displayPokemon.weight">
                  <h3 class="text-white/60 text-sm font-semibold mb-1">
                    {{ t("modal.weight") }}
                  </h3>
                  <p class="text-white text-lg">{{ displayPokemon.weight }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistiques -->
          <div v-if="displayPokemon.stats" class="bg-white/5 rounded-2xl p-6">
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.stats") }}
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{ t("modal.hp") }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.hp
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-green-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.hp / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.attack")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.atk
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-red-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.atk / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.defense")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.def
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.def / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.spAttack")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.spe_atk
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-pokedex-red rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.spe_atk / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.spDefense")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.spe_def
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-yellow-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.spe_def / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.speed")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    displayPokemon.stats.vit
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-pink-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (displayPokemon.stats.vit / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Talents -->
          <div
            v-if="displayPokemon.talents && displayPokemon.talents.length > 0"
            class="bg-white/5 rounded-2xl p-6"
          >
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.abilities") }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="talent in displayPokemon.talents"
                :key="talent.name"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  talent.tc
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-white',
                ]"
              >
                {{ abilityName(talent) }}
                <span v-if="talent.tc" class="ml-1 text-xs">{{
                  t("modal.hiddenAbility")
                }}</span>
              </span>
            </div>
          </div>

          <!-- Évolutions -->
          <div
            v-if="
              displayPokemon.evolution &&
              (displayPokemon.evolution.pre || displayPokemon.evolution.next)
            "
            class="bg-white/5 rounded-2xl p-6"
          >
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.evolutions") }}
            </h3>
            <div class="space-y-4">
              <!-- Pré-évolutions -->
              <div
                v-if="displayPokemon.evolution.pre && displayPokemon.evolution.pre.length > 0"
              >
                <h4 class="text-white/60 text-sm font-semibold mb-2">
                  {{ t("modal.preEvolution") }}
                </h4>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="pre in displayPokemon.evolution.pre"
                    :key="pre.pokedex_id"
                    @click="navigateToEvolution(pre.pokedex_id)"
                    class="bg-white/10 rounded-lg p-3 hover:bg-white/20 hover:scale-105 transition-all flex flex-col items-center min-w-[120px] cursor-pointer"
                  >
                    <img
                      :src="getEvolutionSprite(pre)"
                      :alt="evolutionName(pre)"
                      class="h-20 w-20 object-contain mb-2"
                    />
                    <p class="text-white font-medium text-center">{{ evolutionName(pre) }}</p>
                    <p class="text-white/60 text-xs text-center">{{ evolutionCondition(pre) }}</p>
                  </button>
                </div>
              </div>

              <!-- Évolutions suivantes -->
              <div
                v-if="
                  displayPokemon.evolution.next && displayPokemon.evolution.next.length > 0
                "
              >
                <h4 class="text-white/60 text-sm font-semibold mb-2">
                  {{ t("modal.evolution") }}
                </h4>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="next in displayPokemon.evolution.next"
                    :key="next.pokedex_id"
                    @click="navigateToEvolution(next.pokedex_id)"
                    class="bg-white/10 rounded-lg p-3 hover:bg-white/20 hover:scale-105 transition-all flex flex-col items-center min-w-[120px] cursor-pointer"
                  >
                    <img
                      :src="getEvolutionSprite(next)"
                      :alt="evolutionName(next)"
                      class="h-20 w-20 object-contain mb-2"
                    />
                    <p class="text-white font-medium text-center">{{ evolutionName(next) }}</p>
                    <p class="text-white/60 text-xs text-center">{{ evolutionCondition(next) }}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-gradient-to-br,
.modal-leave-active .bg-gradient-to-br {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-gradient-to-br,
.modal-leave-to .bg-gradient-to-br {
  transform: scale(0.9);
}
</style>
