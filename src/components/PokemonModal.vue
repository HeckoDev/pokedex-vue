<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeColor, getTypeGradient } from "@/utils/typeColors";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { fetchPokemonSpecies } from "@/services/pokeapi";
import { loadRegionalForm, loadMegaEvolutionData, loadGigamaxData } from "@/services/pokeapi-transform";

const { t } = useTranslation();

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

// Ref for the modal container
const modalRef = ref<HTMLElement | null>(null);
const isOpenRef = ref(false);

// API-enriched Pokemon data
const enrichedPokemon = ref<Pokemon | null>(null);
const isLoadingDetails = ref(false);

// Current form data (regional, mega, gigamax)
const currentFormData = ref<Pokemon | null>(null);
const isLoadingForm = ref(false);

type FormType = 'normal' | 'regional' | 'mega' | 'gigamax';

interface PokemonForm {
  type: FormType;
  label: string;
  index?: number;
}

const selectedForm = ref<PokemonForm>({ type: 'normal', label: 'Forme Normale' });

// Display current form data or fallback to enriched/base Pokemon
const displayPokemon = computed(() => currentFormData.value || enrichedPokemon.value || props.pokemon);

// Set up focus trap
useFocusTrap(modalRef, isOpenRef, () => emit("close"));

watch(() => props.isOpen, (newVal) => {
  isOpenRef.value = newVal;
  
  if (newVal && props.pokemon) {
    loadEnrichedDetails(props.pokemon);
  }
}, { immediate: true });

// Load enriched Pokemon data from API
const loadEnrichedDetails = async (pokemon: Pokemon) => {
  isLoadingDetails.value = true;
  currentFormData.value = null;
  try {
    enrichedPokemon.value = await props.enrichPokemon(pokemon);
  } catch (error) {
    console.error("Error loading Pokemon details:", error);
    enrichedPokemon.value = pokemon;
  } finally {
    isLoadingDetails.value = false;
  }
};

// Load specific alternative form data from API
const loadAlternativeForm = async (form: PokemonForm) => {
  if (!enrichedPokemon.value) return;
  
  isLoadingForm.value = true;
  
  try {
    if (form.type === 'regional' && form.index !== undefined) {
      const formeName = enrichedPokemon.value.formes?.[form.index]?.region;
      if (formeName) {
        const species = await fetchPokemonSpecies(enrichedPokemon.value.pokedex_id);
        currentFormData.value = await loadRegionalForm(enrichedPokemon.value, formeName, species);
      }
    } else if (form.type === 'mega' && form.index !== undefined) {
      const megaLabel = form.label;
      let megaVariant = '';
      
      if (megaLabel.includes('X')) {
        megaVariant = 'X';
      } else if (megaLabel.includes('Y')) {
        megaVariant = 'Y';
      }
      
      currentFormData.value = await loadMegaEvolutionData(enrichedPokemon.value, megaVariant || 'mega');
    } else if (form.type === 'gigamax') {
      currentFormData.value = await loadGigamaxData(enrichedPokemon.value);
    } else {
      currentFormData.value = null;
    }
  } catch (error) {
    console.error("Error loading form data:", error);
    currentFormData.value = null;
  } finally {
    isLoadingForm.value = false;
  }
};

watch(() => selectedForm.value, async (newForm) => {
  if (newForm.type === 'normal') {
    currentFormData.value = null;
  } else {
    await loadAlternativeForm(newForm);
  }
});

// Available forms list
const availableForms = computed(() => {
  if (!displayPokemon.value) return [];
  
  const forms: PokemonForm[] = [
    { type: 'normal', label: t('modal.normalForm') || 'Forme Normale' }
  ];
  
  if (displayPokemon.value.formes && displayPokemon.value.formes.length > 0) {
    displayPokemon.value.formes.forEach((forme, index) => {
      forms.push({
        type: 'regional',
        label: `${t('modal.form') || 'Forme'} ${forme.region.charAt(0).toUpperCase() + forme.region.slice(1)}`,
        index
      });
    });
  }
  
  if (displayPokemon.value.evolution?.mega && displayPokemon.value.evolution.mega.length > 0) {
    displayPokemon.value.evolution.mega.forEach((mega, index) => {
      forms.push({
        type: 'mega',
        label: displayPokemon.value.evolution!.mega!.length > 1 
          ? `${t('modal.megaEvolution')} ${String.fromCharCode(88 + index)}` 
          : t('modal.megaEvolution') || 'Méga-Évolution',
        index
      });
    });
  }
  
  if (displayPokemon.value.sprites.gmax) {
    forms.push({
      type: 'gigamax',
      label: t('modal.gigamax') || 'Gigamax'
    });
  }
  
  return forms;
});

watch(() => displayPokemon.value?.pokedex_id, () => {
  selectedForm.value = { type: 'normal', label: t('modal.normalForm') || 'Forme Normale' };
});

// Current sprite based on selected form and shiny mode
const currentFormSprite = computed(() => {
  if (!displayPokemon.value) return "";
  
  const shiny = localIsShiny.value;
  
  if (selectedForm.value.type === 'mega' && selectedForm.value.index !== undefined && displayPokemon.value.evolution?.mega) {
    const mega = displayPokemon.value.evolution.mega[selectedForm.value.index];
    return shiny && mega.sprites.shiny ? mega.sprites.shiny : mega.sprites.regular;
  }
  
  if (selectedForm.value.type === 'gigamax' && displayPokemon.value.sprites.gmax) {
    if (typeof displayPokemon.value.sprites.gmax === 'string') {
      return displayPokemon.value.sprites.gmax;
    } else {
      return shiny && displayPokemon.value.sprites.gmax.shiny 
        ? displayPokemon.value.sprites.gmax.shiny 
        : displayPokemon.value.sprites.gmax.regular;
    }
  }
  
  return shiny && displayPokemon.value.sprites.shiny 
    ? displayPokemon.value.sprites.shiny 
    : displayPokemon.value.sprites.regular;
});

const localIsShiny = ref(false);
watch(() => props.isShiny, (newVal) => {
  localIsShiny.value = newVal;
}, { immediate: true });

watch(() => props.pokemon?.pokedex_id, () => {
  localIsShiny.value = props.isShiny;
  enrichedPokemon.value = null;
  currentFormData.value = null;
  selectedForm.value = { type: 'normal', label: t('modal.normalForm') || 'Forme Normale' };
});

const spriteUrl = computed(() => currentFormSprite.value);

const toggleShiny = () => {
  if (displayPokemon.value?.sprites.shiny) {
    localIsShiny.value = !localIsShiny.value;
  }
};
const headerGradient = computed(() => {
  if (!displayPokemon.value?.types || displayPokemon.value.types.length === 0) {
    return "from-purple-600 to-pink-600";
  }
  
  const type1 = displayPokemon.value.types[0].name;
  const type2 = displayPokemon.value.types.length > 1 ? displayPokemon.value.types[1].name : undefined;
  
  return getTypeGradient(type1, type2);
});

const getEvolutionSprite = (pokedexId: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexId}.png`;
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
            <span class="text-white/80 text-lg" :aria-label="`Numéro du Pokédex ${displayPokemon.pokedex_id}`">
              #{{ displayPokemon.pokedex_id.toString().padStart(3, "0") }}
            </span>
          </div>
          <button
            @click="closeModal"
            class="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Fermer la fenêtre modale"
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
              @click="selectedForm = form"
              :class="[
                'flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-white/50',
                selectedForm.type === form.type && selectedForm.index === form.index
                  ? 'bg-white text-purple-700 shadow-lg scale-105'
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
                {{ isLoadingForm ? (t("loading.form") || "Chargement de la forme...") : (t("loading.details") || "Chargement des détails...") }}
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
                :title="displayPokemon.sprites.shiny ? (localIsShiny ? 'Click for normal version' : 'Click for shiny version ✨') : 'No shiny version available'"
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
                <h3 class="text-white/60 text-sm font-semibold mb-2">Types</h3>
                <div class="flex gap-2">
                  <span
                    v-for="type in displayPokemon.types"
                    :key="type.name"
                    :class="[
                      getTypeColor(type.name),
                      'px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md',
                    ]"
                  >
                    {{ type.name }}
                  </span>
                </div>
              </div>

              <!-- Catégorie -->
              <div>
                <h3 class="text-white/60 text-sm font-semibold mb-1">
                  {{ t("modal.category") }}
                </h3>
                <p class="text-white text-lg">{{ displayPokemon.category }}</p>
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
                    class="bg-purple-500 rounded-full h-2 transition-all"
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
                {{ talent.name }}
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
                      :src="getEvolutionSprite(pre.pokedex_id)"
                      :alt="pre.name"
                      class="h-20 w-20 object-contain mb-2"
                    />
                    <p class="text-white font-medium text-center">{{ pre.name }}</p>
                    <p class="text-white/60 text-xs text-center">{{ pre.condition }}</p>
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
                      :src="getEvolutionSprite(next.pokedex_id)"
                      :alt="next.name"
                      class="h-20 w-20 object-contain mb-2"
                    />
                    <p class="text-white font-medium text-center">{{ next.name }}</p>
                    <p class="text-white/60 text-xs text-center">{{ next.condition }}</p>
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
