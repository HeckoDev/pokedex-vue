<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeLabel } from "@/utils/pokemonI18n";
import type { Pokemon } from "@/types/pokemon";
import PokemonCard from "./PokemonCard.vue";
import PokemonModal from "./PokemonModal.vue";

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
  loadPokemons,
} = usePokemon();

const { t, setUILanguage } = useTranslation();

const showScrollButton = ref(false);
const selectedPokemon = ref<Pokemon | null>(null);
const isModalOpen = ref(false);

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
};

// Reload the Pokédex data after a loading error
const retryLoad = () => {
  loadPokemons();
};

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
          @click="$emit('openFilters')"
          class="px-6 py-3 rounded-lg bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors shadow-e2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus whitespace-nowrap"
          :aria-label="t('filters.advanced.button')"
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
              v-if="selectedGenerations.length > 0 || sortBy"
              class="bg-white text-pokedex-red text-xs rounded-full px-2 py-0.5 font-bold"
            >
              {{ selectedGenerations.length > 0 ? selectedGenerations.length : '✓' }}
            </span>
          </span>
        </button>
      </div>

      <!-- Language selector -->
      <div class="flex justify-center gap-2 flex-wrap" role="group" :aria-label="t('aria.languageSelection')">
        <button
          @click="
            () => {
              selectedLanguage = 'fr';
              setUILanguage('fr');
            }
          "
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'fr'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'fr'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.fr') })"
        >
          🇫🇷 {{ t("languages.fr") }}
        </button>
        <button
          @click="
            () => {
              selectedLanguage = 'en';
              setUILanguage('en');
            }
          "
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'en'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'en'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.en') })"
        >
          🇬🇧 {{ t("languages.en") }}
        </button>
        <button
          @click="
            () => {
              selectedLanguage = 'jp';
              setUILanguage('jp');
            }
          "
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            selectedLanguage === 'jp'
              ? 'bg-white text-pokedex-red shadow-e2'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'jp'"
          :aria-label="t('aria.selectLanguage', { language: t('languages.jp') })"
        >
          🇯🇵 {{ t("languages.jp") }}
        </button>
      </div>

      <!-- Toggle Shiny -->
      <div class="flex justify-center">
        <button
          @click="isShiny = !isShiny"
          :class="[
            'px-8 py-3 rounded-lg font-bold transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            isShiny
              ? 'bg-pokedex-gold text-surface-base'
              : 'bg-white/40 text-white hover:bg-white/60',
          ]"
          :aria-pressed="isShiny"
          :aria-label="isShiny ? t('shiny.activated') : t('shiny.activate')"
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
      <div class="text-center mb-6" aria-hidden="true">
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
          @click="retryLoad"
          class="px-6 py-2.5 rounded-control bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
          <PokemonCard
            v-for="(pokemon, i) in filteredPokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
            :style="{ animationDelay: `${Math.min(i, 12) * 40}ms` }"
            class="pokemon-cell motion-safe:animate-fade-up"
            @click="openPokemonModal(pokemon)"
            @open-auth="$emit('openAuth')"
          />
        </div>
      </section>

      <!-- Grouped by generation when no sorting -->
      <section
        v-else
        v-for="{ generation, pokemons } in pokemonsByGeneration"
        :key="generation"
        :id="`gen-${generation}`"
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
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr"
        >
          <PokemonCard
            v-for="(pokemon, i) in pokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
            :style="{ animationDelay: `${Math.min(i, 12) * 40}ms` }"
            class="pokemon-cell motion-safe:animate-fade-up"
            @click="openPokemonModal(pokemon)"
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
        @click="clearFilters"
        class="mt-4 px-6 py-2.5 rounded-control bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {{ t("search.clearFilters") }}
      </button>
    </div>

    <!-- Floating button to scroll up -->
    <Transition name="fade">
      <button
        v-if="showScrollButton"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 bg-pokedex-red text-white p-4 rounded-full shadow-e4 motion-safe:hover:scale-110 motion-safe:transition-transform duration-200 z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        :aria-label="t('aria.backToTop')"
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

    <!-- Modal Pokémon -->
    <PokemonModal
      :pokemon="selectedPokemon"
      :language="selectedLanguage"
      :is-shiny="isShiny"
      :is-open="isModalOpen"
      :enrich-pokemon="enrichPokemonFromAPI"
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
