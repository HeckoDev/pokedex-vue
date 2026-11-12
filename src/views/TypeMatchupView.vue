<script setup lang="ts">
import { computed, ref } from "vue";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeLabel } from "@/utils/pokemonI18n";
import { getTypeColor } from "@/utils/typeColors";
import { ALL_TYPES, computeDefense, groupByMultiplier, searchPokemonByName } from "@/utils/typeChart";
import type { Pokemon } from "@/types/pokemon";
import PokemonModal from "@/components/PokemonModal.vue";

defineEmits<{
  openAuth: [];
  openFilters: [];
}>();

const { t } = useTranslation();
const { pokemons, selectedLanguage, isShiny, getPokemonById, enrichPokemonFromAPI } = usePokemon();

const query = ref("");
const selectedPokemon = ref<Pokemon | null>(null);
const manualTypes = ref<string[]>([]);
const isModalOpen = ref(false);

const MAX_TYPES = 2;

const suggestions = computed(() => searchPokemonByName(pokemons.value, query.value));

// A selected Pokémon takes precedence over manually chosen types
const activeTypes = computed<string[]>(() =>
  selectedPokemon.value ? (selectedPokemon.value.types ?? []).map((type) => type.name) : manualTypes.value
);

const groups = computed(() => groupByMultiplier(computeDefense(activeTypes.value)));

// Weaknesses / neutral / resistances (immunities included) as three distinct panels
const PANELS = [
  { id: "weak", multipliers: [4, 2], box: "border-red-500/60 bg-red-950/30", head: "bg-red-800 text-white" },
  { id: "neutral", multipliers: [1], box: "border-gray-500/60 bg-gray-800/30", head: "bg-gray-700 text-white" },
  { id: "resist", multipliers: [0.5, 0.25, 0], box: "border-green-500/60 bg-green-950/30", head: "bg-green-800 text-white" },
] as const;

const panels = computed(() =>
  PANELS.map((panel) => ({
    ...panel,
    groups: groups.value.filter((group) => (panel.multipliers as readonly number[]).includes(group.multiplier)),
  }))
);

// Pokémon having every selected type, for the dropdown
const pokemonsOfTypes = computed(() =>
  manualTypes.value.length
    ? pokemons.value.filter((pokemon) =>
        manualTypes.value.every((type) => pokemon.types?.some((candidate) => candidate.name === type))
      )
    : []
);

const selectedFromList = computed(() =>
  selectedPokemon.value && pokemonsOfTypes.value.some((p) => p.pokedex_id === selectedPokemon.value!.pokedex_id)
    ? String(selectedPokemon.value.pokedex_id)
    : ""
);

const pickFromList = (event: Event) => {
  const pokemon = getPokemonById(Number((event.target as HTMLSelectElement).value));
  if (pokemon) selectedPokemon.value = pokemon;
  else selectedPokemon.value = null;
};

const pokemonName = (pokemon: Pokemon): string => pokemon.name[selectedLanguage.value] ?? pokemon.name.en;

const targetLabel = computed(() =>
  selectedPokemon.value
    ? pokemonName(selectedPokemon.value)
    : activeTypes.value.map((type) => getTypeLabel(type, selectedLanguage.value)).join(" / ")
);

// Short announcement for screen readers (the full results are not re-read on every change)
const statusMessage = computed(() => {
  if (query.value.trim()) {
    return suggestions.value.length ? t("matchup.resultsCount", { count: suggestions.value.length }) : t("matchup.noMatch");
  }
  return activeTypes.value.length ? t("matchup.resultFor", { target: targetLabel.value }) : "";
});

const selectPokemon = (pokemon: Pokemon) => {
  selectedPokemon.value = pokemon;
  manualTypes.value = [];
  query.value = "";
};

const clearPokemon = () => {
  selectedPokemon.value = null;
};

const toggleType = (type: string) => {
  selectedPokemon.value = null;
  if (manualTypes.value.includes(type)) {
    manualTypes.value = manualTypes.value.filter((current) => current !== type);
  } else {
    manualTypes.value = [...manualTypes.value, type].slice(-MAX_TYPES);
  }
};

const navigateTo = (pokedexId: number) => {
  const pokemon = getPokemonById(pokedexId);
  if (pokemon) selectedPokemon.value = pokemon;
};

const MULTIPLIER_TEXT: Record<number, string> = { 4: "×4", 2: "×2", 1: "×1", 0.5: "×½", 0.25: "×¼", 0: "×0" };

const GROUP_STYLE: Record<number, { title: "veryWeak" | "weak" | "neutral" | "resist" | "veryResist" | "immuneGroup"; badge: string }> = {
  4: { title: "veryWeak", badge: "bg-red-700 text-white" },
  2: { title: "weak", badge: "bg-orange-700 text-white" },
  1: { title: "neutral", badge: "bg-gray-600 text-white" },
  0.5: { title: "resist", badge: "bg-green-700 text-white" },
  0.25: { title: "veryResist", badge: "bg-emerald-800 text-white" },
  0: { title: "immuneGroup", badge: "bg-slate-950 text-white border border-white/30" },
};

const PANEL_TITLE = { weak: "weaknesses", neutral: "neutralPanel", resist: "resistances" } as const;
</script>

<template>
  <main class="container mx-auto px-4 pb-12 pt-6 max-w-5xl">
    <h2 class="text-content-strong text-3xl font-bold text-center mb-2">{{ t("matchup.title") }}</h2>
    <p class="text-content-muted text-center mb-8">{{ t("matchup.intro") }}</p>

    <!-- Selected Pokémon, shown above the search -->
    <div v-if="selectedPokemon" class="mb-4" data-testid="selected-pokemon">
      <p class="text-content-muted text-sm mb-2">{{ t("matchup.selectedPokemon") }}</p>
      <div class="inline-flex items-stretch rounded-card border border-surface-border bg-surface-overlay overflow-hidden">
        <button
          type="button"
          class="flex items-center gap-3 pl-3 pr-4 py-2 hover:bg-surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="isModalOpen = true"
        >
          <img
            v-if="selectedPokemon.sprites?.regular"
            :src="selectedPokemon.sprites.regular"
            alt=""
            class="w-14 h-14 object-contain"
          />
          <span class="text-left">
            <span class="block text-content-strong font-bold text-lg">{{ pokemonName(selectedPokemon) }}</span>
            <span class="flex gap-1 mt-1">
              <span
                v-for="type in selectedPokemon.types ?? []"
                :key="type.name"
                :class="[getTypeColor(type.name), 'text-white text-xs font-semibold px-2 py-0.5 rounded-full']"
              >
                {{ getTypeLabel(type.name, selectedLanguage) }}
              </span>
            </span>
          </span>
          <span class="sr-only">— {{ t("matchup.openDetails", { name: pokemonName(selectedPokemon) }) }}</span>
        </button>
        <button
          type="button"
          class="px-3 border-l border-surface-border text-content-muted hover:text-content-strong hover:bg-surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          :aria-label="t('matchup.clearPokemon', { name: pokemonName(selectedPokemon) })"
          @click="clearPokemon"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <label for="matchup-search" class="block text-content-strong font-semibold mb-2">
        {{ t("matchup.searchLabel") }}
      </label>
      <input
        id="matchup-search"
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="t('matchup.searchPlaceholder')"
        class="w-full px-4 py-3 rounded-control bg-surface-overlay border border-surface-border text-content-strong placeholder:text-content-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
      <ul v-if="suggestions.length" class="mt-2 rounded-card border border-surface-border bg-surface-raised divide-y divide-surface-border" data-testid="suggestions">
        <li v-for="pokemon in suggestions" :key="pokemon.pokedex_id">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            @click="selectPokemon(pokemon)"
          >
            <img v-if="pokemon.sprites?.regular" :src="pokemon.sprites.regular" alt="" class="w-10 h-10 object-contain" loading="lazy" />
            <span class="text-content-strong font-semibold">{{ pokemonName(pokemon) }}</span>
            <span class="text-content-subtle text-sm">#{{ pokemon.pokedex_id }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="query.trim()" class="mt-2 text-content-muted">{{ t("matchup.noMatch") }}</p>
    </div>

    <!-- Type picker -->
    <fieldset class="mb-8">
      <legend class="text-content-strong font-semibold mb-2">{{ t("matchup.typesLabel") }}</legend>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in ALL_TYPES"
          :key="type"
          type="button"
          :aria-pressed="manualTypes.includes(type)"
          :class="[
            getTypeColor(type),
            'text-white font-semibold px-3 py-2 min-h-[44px] rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            manualTypes.includes(type) ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-base font-extrabold' : 'hover:brightness-110',
          ]"
          @click="toggleType(type)"
        >
          <span v-if="manualTypes.includes(type)" aria-hidden="true">✓ </span>{{ getTypeLabel(type, selectedLanguage) }}
        </button>
      </div>
      <div v-if="manualTypes.length" class="mt-4">
        <label for="matchup-type-pokemon" class="block text-content-strong font-semibold mb-2">
          {{ t("matchup.pokemonOfType", { count: pokemonsOfTypes.length }) }}
        </label>
        <select
          id="matchup-type-pokemon"
          :value="selectedFromList"
          class="w-full px-4 py-3 rounded-control bg-surface-overlay border border-surface-border text-content-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @change="pickFromList"
        >
          <option value="">{{ t("matchup.chooseFromList") }}</option>
          <option v-for="pokemon in pokemonsOfTypes" :key="pokemon.pokedex_id" :value="String(pokemon.pokedex_id)">
            #{{ pokemon.pokedex_id }} {{ pokemonName(pokemon) }}
          </option>
        </select>
      </div>
    </fieldset>

    <!-- Results -->
    <p class="sr-only" role="status" data-testid="matchup-status">{{ statusMessage }}</p>
    <section data-testid="matchup-results">
      <p v-if="!activeTypes.length" class="text-content-muted text-center py-10">{{ t("matchup.empty") }}</p>

      <template v-else>
        <h3 class="text-content-strong text-xl font-bold mb-4">
          {{ t("matchup.resultFor", { target: targetLabel }) }}
        </h3>

        <div class="grid gap-4 lg:grid-cols-3 items-start">
          <section
            v-for="panel in panels"
            :key="panel.id"
            :class="['rounded-card border-2 overflow-hidden', panel.box]"
            :data-testid="`panel-${panel.id}`"
          >
            <h4 :class="[panel.head, 'text-lg font-bold px-4 py-3']">{{ t(`matchup.${PANEL_TITLE[panel.id]}`) }}</h4>
            <p v-if="!panel.groups.length" class="px-4 py-6 text-content-muted text-center">—</p>
            <div v-for="group in panel.groups" :key="group.multiplier" class="p-4" :data-testid="`group-${group.multiplier}`">
              <h5 class="flex items-center gap-2 mb-2">
                <span :class="[GROUP_STYLE[group.multiplier].badge, 'text-xl font-extrabold px-2.5 py-0.5 rounded-control min-w-[3.5rem] text-center']">
                  {{ MULTIPLIER_TEXT[group.multiplier] }}
                </span>
                <span class="text-content-strong font-semibold text-sm">{{ t(`matchup.${GROUP_STYLE[group.multiplier].title}`) }}</span>
              </h5>
              <ul class="grid grid-cols-2 gap-2">
                <li
                  v-for="type in group.types"
                  :key="type"
                  :class="[getTypeColor(type), 'flex items-center justify-between gap-2 rounded-control px-3 py-2 text-white']"
                >
                  <span class="font-semibold">{{ getTypeLabel(type, selectedLanguage) }}</span>
                  <span class="font-extrabold">{{ MULTIPLIER_TEXT[group.multiplier] }}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
        <p class="text-content-subtle text-sm mt-6">{{ t("matchup.hint") }}</p>
      </template>
    </section>

    <PokemonModal
      :pokemon="selectedPokemon"
      :language="selectedLanguage"
      :is-shiny="isShiny"
      :is-open="isModalOpen"
      :enrich-pokemon="enrichPokemonFromAPI"
      @close="isModalOpen = false"
      @navigate="navigateTo"
    />
  </main>
</template>
