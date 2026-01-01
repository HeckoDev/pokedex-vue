<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
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
} = usePokemon();

const { t, setUILanguage } = useTranslation();

const showScrollButton = ref(false);
const selectedPokemon = ref<Pokemon | null>(null);
const isModalOpen = ref(false);

// Determine if we should show flat list or grouped by generation
const showFlatList = computed(() => sortBy.value !== null);

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

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="container mx-auto px-4 pb-12" role="main">
    <div class="text-center mb-8">
      <h1 class="text-white text-4xl md:text-5xl font-bold">
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
          class="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-describedby="search-description"
        />
        <span id="search-description" class="sr-only">{{ t('aria.searchDescription') }}</span>
        <label for="type-filter" class="sr-only">{{ t('aria.typeFilter') }}</label>
        <select
          id="type-filter"
          v-model="selectedType"
          class="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          :aria-label="t('aria.typeFilterLabel')"
        >
          <option value="">{{ t("filters.allTypes") }}</option>
          <option v-for="type in allTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        <button
          @click="$emit('openFilters')"
          class="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 whitespace-nowrap"
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
              class="bg-white text-purple-600 text-xs rounded-full px-2 py-0.5 font-bold"
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
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
            selectedLanguage === 'fr'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'fr'"
          :aria-label="`Sélectionner ${t('languages.fr')}`"
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
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
            selectedLanguage === 'en'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'en'"
          :aria-label="`Sélectionner ${t('languages.en')}`"
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
            'px-6 py-2 rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
            selectedLanguage === 'jp'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
          :aria-pressed="selectedLanguage === 'jp'"
          :aria-label="`Sélectionner ${t('languages.jp')}`"
        >
          🇯🇵 {{ t("languages.jp") }}
        </button>
      </div>

      <!-- Toggle Shiny -->
      <div class="flex justify-center">
        <button
          @click="isShiny = !isShiny"
          :class="[
            'px-8 py-3 rounded-lg font-bold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
            isShiny
              ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white'
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
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
        <p class="text-white text-xl font-semibold">
          {{ t("loading.pokemons") || "Chargement des Pokémon..." }}
        </p>
        <p class="text-white/70 mt-2">
          {{ loadingProgress.loaded }} / {{ loadingProgress.total }}
        </p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
        <p class="text-white text-xl font-semibold mb-4">
          ⚠️ {{ t("error.loading") || "Erreur de chargement" }}
        </p>
        <p class="text-white/90 mb-4">{{ error }}</p>
      </div>
    </div>

    <!-- Pokemon list -->
    <div v-else-if="pokemonsByGeneration.length > 0 || filteredPokemons.length > 0" class="space-y-12">
      <!-- Screen reader announcement for search results -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ showFlatList ? filteredPokemons.length : pokemonsByGeneration.reduce((acc, gen) => acc + gen.pokemons.length, 0) }} Pokémon trouvés
      </div>

      <!-- Flat list when sorting is active -->
      <section v-if="showFlatList" aria-label="Liste des Pokémon triés">
        <!-- Sort indicator -->
        <div class="mb-6 text-center">
          <div class="inline-flex items-center gap-2 bg-purple-600/30 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span class="font-semibold">{{ filteredPokemons.length }} Pokémon triés</span>
          </div>
        </div>
        
        <!-- Grid of all Pokemon -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <PokemonCard
            v-for="pokemon in filteredPokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
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
        :aria-label="`${t(`generations.${generation}` as any)} - ${pokemons.length} Pokémon`"
      >
        <!-- Generation header -->
        <div class="mb-6">
          <h2 class="text-white text-3xl font-bold text-center mb-2">
            {{ t(`generations.${generation}` as any) }}
          </h2>
          <p class="text-white/70 text-center">
            {{ pokemons.length }}
            {{ pokemons.length > 1 ? t("count.pokemons") : t("count.pokemon") }}
          </p>
        </div>

        <!-- Grille de Pokémon -->
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <PokemonCard
            v-for="pokemon in pokemons"
            :key="pokemon.pokedex_id"
            :pokemon="pokemon"
            :language="selectedLanguage"
            :is-shiny="isShiny"
            @click="openPokemonModal(pokemon)"
            @open-auth="$emit('openAuth')"
          />
        </div>
      </section>
    </div>

    <!-- Message if no results -->
    <div v-else class="text-center mt-12" role="status" aria-live="polite">
      <p class="text-white text-xl">{{ t("search.noResults") }}</p>
    </div>

    <!-- Floating button to scroll up -->
    <Transition name="fade">
      <button
        v-if="showScrollButton"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 bg-white text-purple-700 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
