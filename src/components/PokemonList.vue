<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import type { Pokemon } from "@/types/pokemon";
import PokemonCard from "./PokemonCard.vue";
import PokemonModal from "./PokemonModal.vue";

defineEmits<{
  openAuth: [];
}>();

const {
  pokemonsByGeneration,
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
} = usePokemon();

const { t, setUILanguage } = useTranslation();

const showScrollButton = ref(false);
const selectedPokemon = ref<Pokemon | null>(null);
const isModalOpen = ref(false);

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
      <div class="flex flex-col md:flex-row gap-4" role="search" aria-label="Rechercher et filtrer les Pokémon">
        <label for="pokemon-search" class="sr-only">Rechercher un Pokémon</label>
        <input
          id="pokemon-search"
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          class="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-describedby="search-description"
        />
        <span id="search-description" class="sr-only">Tapez pour rechercher un Pokémon par son nom</span>
        <label for="type-filter" class="sr-only">Filtrer par type</label>
        <select
          id="type-filter"
          v-model="selectedType"
          class="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label="Filtrer par type de Pokémon"
        >
          <option value="">{{ t("filters.allTypes") }}</option>
          <option v-for="type in allTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <!-- Language selector -->
      <div class="flex justify-center gap-2 flex-wrap" role="group" aria-label="Sélection de la langue">
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
    <div v-else-if="pokemonsByGeneration.length > 0" class="space-y-12">
      <!-- Screen reader announcement for search results -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ pokemonsByGeneration.reduce((acc, gen) => acc + gen.pokemons.length, 0) }} Pokémon trouvés
      </div>
      <section
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
        aria-label="Retour en haut de la page"
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
