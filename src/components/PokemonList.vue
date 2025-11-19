<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { usePokemon } from "@/composables/usePokemon";
import type { Pokemon } from "@/types/pokemon";
import PokemonCard from "./PokemonCard.vue";
import PokemonModal from "./PokemonModal.vue";

const {
  pokemonsByGeneration,
  searchQuery,
  selectedType,
  selectedLanguage,
  isShiny,
  allTypes,
} = usePokemon();

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

const generationNames: Record<number, string> = {
  1: "Génération I - Kanto",
  2: "Génération II - Johto",
  3: "Génération III - Hoenn",
  4: "Génération IV - Sinnoh",
  5: "Génération V - Unys",
  6: "Génération VI - Kalos",
  7: "Génération VII - Alola",
  8: "Génération VIII - Galar",
  9: "Génération IX - Paldea",
};
</script>

<template>
  <div class="container mx-auto px-4 pb-12">
    <h1 class="text-white text-4xl md:text-5xl font-bold text-center mb-8">
      🔴 Pokédex
    </h1>

    <!-- Filtres et sélecteur de langue -->
    <div class="max-w-4xl mx-auto mb-8 space-y-4">
      <div class="flex flex-col md:flex-row gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un Pokémon..."
          class="flex-1 px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select
          v-model="selectedType"
          class="px-4 py-3 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Tous les types</option>
          <option v-for="type in allTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <!-- Sélecteur de langue -->
      <div class="flex justify-center gap-2 flex-wrap">
        <button
          @click="selectedLanguage = 'fr'"
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all',
            selectedLanguage === 'fr'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
        >
          🇫🇷 Français
        </button>
        <button
          @click="selectedLanguage = 'en'"
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all',
            selectedLanguage === 'en'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
        >
          🇬🇧 English
        </button>
        <button
          @click="selectedLanguage = 'jp'"
          :class="[
            'px-6 py-2 rounded-lg font-semibold transition-all',
            selectedLanguage === 'jp'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'bg-white/30 text-white hover:bg-white/50',
          ]"
        >
          🇯🇵 日本語
        </button>
      </div>

      <!-- Toggle Shiny -->
      <div class="flex justify-center">
        <button
          @click="isShiny = !isShiny"
          :class="[
            'px-8 py-3 rounded-lg font-bold transition-all shadow-lg',
            isShiny
              ? 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white'
              : 'bg-white/40 text-white hover:bg-white/60',
          ]"
        >
          <span class="flex items-center gap-2">
            <span v-if="isShiny">✨</span>
            {{ isShiny ? "Mode Shiny activé" : "Activer le mode Shiny" }}
            <span v-if="isShiny">✨</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Liste par génération -->
    <div v-if="pokemonsByGeneration.length > 0" class="space-y-12">
      <section
        v-for="{ generation, pokemons } in pokemonsByGeneration"
        :key="generation"
        :id="`gen-${generation}`"
      >
        <!-- En-tête de génération -->
        <div class="mb-6">
          <h2 class="text-white text-3xl font-bold text-center mb-2">
            {{ generationNames[generation] || `Génération ${generation}` }}
          </h2>
          <p class="text-white/70 text-center">
            {{ pokemons.length }} Pokémon{{ pokemons.length > 1 ? "s" : "" }}
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
          />
        </div>
      </section>
    </div>

    <!-- Message si aucun résultat -->
    <div v-else class="text-center mt-12">
      <p class="text-white text-xl">Aucun Pokémon trouvé 😢</p>
    </div>

    <!-- Bouton flottant pour remonter -->
    <Transition name="fade">
      <button
        v-if="showScrollButton"
        @click="scrollToTop"
        class="fixed bottom-8 right-8 bg-white text-purple-700 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50"
        aria-label="Retour en haut"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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
      @close="closeModal"
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
