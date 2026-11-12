<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import PokeballSpinner from "./PokeballSpinner.vue";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeLabel } from "@/utils/pokemonI18n";
import type { Pokemon } from "@/types/pokemon";
import PokemonCard from "./PokemonCard.vue";
import PokemonModal from "./PokemonModal.vue";
import ComparisonModal from "./ComparisonModal.vue";
import { countExtraFilters, emptyExtraFilters } from "@/utils/pokemonFilters";

defineEmits<{
  openAuth: [];
  openFilters: [];
}>();

const {
  pokemonsByGeneration,
  filteredPokemons,
  searchQuery,
  selectedType,
  selectedLanguage,
  isShiny,
  allTypes,
  getPokemonById,
  enrichPokemonFromAPI,
  isLoading,
  loadingProgress,
  error,
  selectedGenerations,
  sortBy,
  extraFilters,
  loadPokemons,
} = usePokemon();

const { t, setUILanguage } = useTranslation();

const showScrollButton = ref(false);
const selectedPokemon = ref<Pokemon | null>(null);
const isModalOpen = ref(false);

// Number of active advanced criteria, shown on the filters button
const advancedCount = computed(
  () => selectedGenerations.value.length + countExtraFilters(extraFilters.value)
);

// Determine if we should show flat list or grouped by generation
const showFlatList = computed(() => sortBy.value !== null);

// Total number of results, used for the live-region announcement
const resultsCount = computed(() =>
  showFlatList.value
    ? filteredPokemons.value.length
    : pokemonsByGeneration.value.reduce((acc, gen) => acc + gen.pokemons.length, 0)
);

// Reset every active filter so the user can recover from an empty result set
const clearFilters = () => {
  searchQuery.value = "";
  selectedType.value = "";
  selectedGenerations.value = [];
  sortBy.value = null;
  extraFilters.value = emptyExtraFilters();
};

// Reload the Pokédex data after a loading error
const retryLoad = () => {
  loadPokemons();
};

// Comparison: pick two Pokémon in the list (a third one replaces the oldest)
const compareMode = ref(false);
const compareSelection = ref<Pokemon[]>([]);
const isComparisonOpen = ref(false);

const isCompared = (pokemon: Pokemon) =>
  compareSelection.value.some((p) => p.pokedex_id === pokemon.pokedex_id);

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value;
  compareSelection.value = [];
  isComparisonOpen.value = false;
};

const toggleCompared = (pokemon: Pokemon) => {
  if (isCompared(pokemon)) {
    compareSelection.value = compareSelection.value.filter((p) => p.pokedex_id !== pokemon.pokedex_id);
  } else {
    compareSelection.value = [...compareSelection.value, pokemon].slice(-2);
  }
};

const handleCardClick = (pokemon: Pokemon) => {
  if (compareMode.value) toggleCompared(pokemon);
  else openPokemonModal(pokemon);
};

const compareStatus = computed(() =>
  compareSelection.value.length === 2
    ? t("compare.launch")
    : t("compare.count", { count: compareSelection.value.length })
);

const openPokemonModal = (pokemon: Pokemon) => {
  selectedPokemon.value = pokemon;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const navigateToEvolution = (pokedexId: number) => {
  const pokemon = getPokemonById(pokedexId);
  if (pokemon) {
    selectedPokemon.value = pokemon;
  }
};

const handleScroll = () => {
  showScrollButton.value = window.scrollY > 300;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <main class="container mx-auto px-4 pb-12">
    <div class="text-center mb-8">
      <h1 class="text-content-strong text-4xl md:text-5xl font-bold">
        {{ t("title") }}
      </h1>
    </div>

    <!-- Filters and language selector -->
    <div class="max-w-4xl mx-auto mb-8 space-y-4">
      <div class="flex flex-col md:flex-row gap-4" role="search" :aria-label="t('aria.pokemonSearch')">
        <label for="pokemon-search" class="sr-only">{{ t('aria.searchLabel') }}</label>
        <input
          id="pokemon-search"
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-describedby="search-description"
        />
        <span id="search-description" class="sr-only">{{ t('aria.searchDescription') }}</span>
        <label for="type-filter" class="sr-only">{{ t('aria.typeFilter') }}</label>
        <select
          id="type-filter"
          v-model="selectedType"
          class="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          :aria-label="t('aria.typeFilterLabel')"
        >
          <option value="">{{ t("filters.allTypes") }}</option>
          <option v-for="type in allTypes" :key="type" :value="type">
            {{ getTypeLabel(type, selectedLanguage) }}
          </option>
        </select>
        <button
          class="px-6 py-3 rounded-lg bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors shadow-e2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus whitespace-nowrap"
          :aria-label="t('filters.advanced.button')"
          @click="$emit('openFilters')"
        >
          <span class="flex items-center gap-2">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {{ t("filters.advanced.button") }}
            <span
              v-if="advancedCount > 0 || sortBy"
              class="bg-white text-pokedex-red text-xs rounded-full px-2 py-0.5 font-bold"
            >
              {{ advancedCount > 0 ? advancedCount : '✓' }}
            </span>
          </span>
        </button>
        <button
          type="button"
          data-testid="compare-toggle"
          :aria-pressed="compareMode"
          :class="[
            'px-6 py-3 rounded-lg font-semibold transition-colors shadow-e2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            compareMode
              ? 'bg-white text-pokedex-red hover:bg-gray-100'
              : 'bg-pokedex-red hover:bg-pokedex-red-dark text-white',
          ]"
          @click="toggleCompareMode"
        >
          {{ compareMode ? t("compare.exit") : t("compare.button") }}
        </button>
      </div>

      <!-- Language selector -->
      <div class="flex justify-center gap-2 flex-wrap" role="group" :aria-label="t('aria.languageSelection')">
        <button
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'fr'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'fr'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.fr') })"
          @click="
            () => {
              selectedLanguage = 'fr';
              setUILanguage('fr');
            }
          "
        >
          🇫🇷 {{ t("languages.fr") }}
        </button>
        <button
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'en'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'en'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.en') })"
          @click="
            () => {
              selectedLanguage = 'en';
              setUILanguage('en');
            }
          "
        >
          🇬🇧 {{ t("languages.en") }}
        </button>
        <button
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'jp'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'jp'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.jp') })"
          @click="
            () => {
              selectedLanguage = 'jp';
              setUILanguage('jp');
            }
          "
        >
          🇯🇵 {{ t("languages.jp") }}
        </button>
      </div>

      <!-- Toggle Shiny -->
      <div class="flex justify-center">
        <button
          :class="[
            'px-8 py-3 rounded-lg font-bold transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            isShiny
              ? 'bg-pokedex-gold text-surface-base'
              : 'bg-white/40 text-white hover:bg-white/60',
          ]"
          :aria-pressed="isShiny"
          :aria-label="isShiny ? t('shiny.activated') : t('shiny.activate')"
          @click="isShiny = !isShiny"
        >
          <span class="flex items-center gap-2">
            <span v-if="isShiny">✨</span>
            {{ isShiny ? t("shiny.activated") : t("shiny.activate") }}
            <span v-if="isShiny">✨</span>
          </span>
        </button>
      </div>
    </div>

    <!-- List by generation -->
    <!-- Loading state: skeleton grid mirrors the real card layout -->
    <div v-if="isLoading">
      <p class="sr-only" role="status" aria-live="polite">
        {{ t("loading.pokemons") }}
      </p>
      <div class="flex flex-col items-center mb-6" aria-hidden="true">
        <PokeballSpinner :size="88" />
        <p class="text-content-muted">
          {{ loadingProgress.loaded }} / {{ loadingProgress.total }}
        </p>
      </div>
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        aria-hidden="true"
      >
        <div
          v-for="n in 18"
          :key="n"
          class="bg-surface-overlay rounded-card p-4 h-48 relative overflow-hidden shadow-e2"
        >
          <div
            class="absolute inset-0 -translate-x-full motion-safe:animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
          ></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-danger/15 border border-danger/40 backdrop-blur-sm rounded-modal p-6 max-w-md mx-auto">
        <p class="text-content-strong text-xl font-semibold mb-4">
          ⚠️ {{ t("error.loading") }}
        </p>
        <p class="text-content-muted mb-4">{{ error }}</p>
        <button
          class="px-6 py-2.5 rounded-control bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="retryLoad"
        >
          {{ t("error.retry") }}
        </button>
      </div>
    </div>

    <!-- Pokemon list -->
    <div v-else-if="pokemonsByGeneration.length > 0 || filteredPokemons.length > 0" class="space-y-12">
      <!-- Screen reader announcement for search results -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ t("search.resultsCount", { count: String(resultsCount) }) }}
      </div>

      <!-- Flat list when sorting is active -->
      <section v-if="showFlatList" :aria-label="t('search.resultsCount', { count: String(filteredPokemons.length) })">
        <!-- Sort indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-2 bg-pokedex-red/20 backdrop-blur-sm rounded-control px-4 py-2 text-content-strong">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span class="font-semibold">{{ t("search.resultsCount", { count: String(filteredPokemons.length) }) }}</span>
          </div>
        </div>
        
        <!-- Grid of all Pokemon -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <PokemonCard
            v-for="(pokemon, i) in filteredPokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
            :active-forms="extraFilters.forms"
            :compare-mode="compareMode"
            :compare-selected="isCompared(pokemon)"
            :style="{ animationDelay: `${Math.min(i, 12) * 40}ms` }"
            class="pokemon-cell motion-safe:animate-fade-up"
            @click="handleCardClick(pokemon)"
            @open-auth="$emit('openAuth')"
          />
        </div>
      </section>

      <!-- Grouped by generation when no sorting -->
      <section
        v-for="{ generation, pokemons } in pokemonsByGeneration"
        v-else
        :id="`gen-${generation}`"
        :key="generation"
        :aria-label="t('aria.generationLabel', { generation: t(`generations.${generation}` as any), count: pokemons.length })"
      >
        <!-- Generation header -->
        <div class="mb-6">
          <h2 class="text-content-strong text-3xl font-bold text-center mb-2">
            {{ t(`generations.${generation}` as any) }}
          </h2>
          <p class="text-content-muted text-center">
            {{ pokemons.length }}
            {{ pokemons.length > 1 ? t("count.pokemons") : t("count.pokemon") }}
          </p>
        </div>

        <!-- Grille de Pokémon -->
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <PokemonCard
            v-for="(pokemon, i) in pokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
            :active-forms="extraFilters.forms"
            :compare-mode="compareMode"
            :compare-selected="isCompared(pokemon)"
            :style="{ animationDelay: `${Math.min(i, 12) * 40}ms` }"
            class="pokemon-cell motion-safe:animate-fade-up"
            @click="handleCardClick(pokemon)"
            @open-auth="$emit('openAuth')"
          />
        </div>
      </section>
    </div>

    <!-- Message if no results -->
    <div v-else class="text-center mt-12" role="status" aria-live="polite">
      <svg
        class="w-20 h-20 text-content-subtle mx-auto mb-4 opacity-60"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="4" />
        <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" stroke-width="4" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="4" />
      </svg>
      <p class="text-content-strong text-xl">{{ t("search.noResults") }}</p>
      <p class="text-content-muted mt-2">{{ t("search.noResultsHint") }}</p>
      <button
        class="mt-4 px-6 py-2.5 rounded-control bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        @click="clearFilters"
      >
        {{ t("search.clearFilters") }}
      </button>
    </div>

    <!-- Floating button to scroll up -->
    <Transition name="fade">
      <button
        v-if="showScrollButton"
        class="fixed bottom-8 right-8 bg-pokedex-red text-white p-4 rounded-full shadow-e4 motion-safe:hover:scale-110 motion-safe:transition-transform duration-200 z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        :aria-label="t('aria.backToTop')"
        @click="scrollToTop"
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </Transition>

    <!-- Comparison: live status, floating launch button, modal -->
    <p class="sr-only" role="status" data-testid="compare-status">
      {{ compareMode ? compareStatus : "" }}
    </p>
    <div
      v-if="compareMode"
      class="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4"
    >
      <button
        v-if="compareSelection.length === 2"
        type="button"
        data-testid="compare-launch"
        class="pointer-events-auto px-8 py-4 rounded-full bg-pokedex-red hover:bg-pokedex-red-dark text-white font-bold shadow-e4 focus:outline-none focus-visible:ring-4 focus-visible:ring-focus"
        @click="isComparisonOpen = true"
      >
        {{ t("compare.launch") }}
      </button>
      <p
        v-else
        aria-hidden="true"
        class="px-5 py-3 rounded-full bg-gray-900/90 text-white text-sm font-semibold shadow-e3"
      >
        {{ compareSelection.length === 0 ? t("compare.hint") : t("compare.count", { count: compareSelection.length }) }}
      </p>
    </div>
    <ComparisonModal
      :is-open="isComparisonOpen"
      :pokemons="compareSelection"
      :language="selectedLanguage"
      :is-shiny="isShiny"
      @close="isComparisonOpen = false"
    />

    <!-- Modal Pokémon -->
    <PokemonModal
      :pokemon="selectedPokemon"
      :language="selectedLanguage"
      :is-shiny="isShiny"
      :is-open="isModalOpen"
      :enrich-pokemon="enrichPokemonFromAPI"
      :preferred-forms="extraFilters.forms"
      @close="closeModal"
      @navigate="navigateToEvolution"
    />
  </main>
</template>

<style scoped>
/* Skip layout/paint of off-screen cards (native virtualization, keeps DOM and anchors intact) */
.pokemon-cell {
  content-visibility: auto;
  contain-intrinsic-size: auto 260px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
