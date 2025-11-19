<script setup lang="ts">
import { computed } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { getTypeColor } from "@/utils/typeColors";
import { useAuth } from "@/composables/useAuth";
import { useFavorites } from "@/composables/useFavorites";

const props = defineProps<{
  pokemon: Pokemon;
  language: Language;
  isShiny: boolean;
}>();

const spriteUrl = computed(() => {
  if (props.isShiny && props.pokemon.sprites.shiny) {
    return props.pokemon.sprites.shiny;
  }
  return props.pokemon.sprites.regular;
});

const emit = defineEmits<{
  click: [];
  openAuth: [];
}>();

const { isAuthenticated } = useAuth();
const { isFavorite, toggleFavorite } = useFavorites();

const handleFavoriteClick = async (event: Event) => {
  event.stopPropagation();

  if (!isAuthenticated.value) {
    emit("openAuth");
    return;
  }

  await toggleFavorite(props.pokemon.pokedex_id);
};
</script>

<template>
  <div
    @click="emit('click')"
    class="bg-gray-800 rounded-2xl p-4 shadow-lg flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-pointer hover:shadow-2xl relative"
  >
    <!-- Favorite button -->
    <button
      v-if="isAuthenticated"
      @click="handleFavoriteClick"
      class="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-700 transition-colors"
      :class="isFavorite(pokemon.pokedex_id) ? 'text-red-500' : 'text-gray-400'"
    >
      <svg
        class="w-5 h-5"
        :fill="isFavorite(pokemon.pokedex_id) ? 'currentColor' : 'none'"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>

    <img
      :src="spriteUrl"
      :alt="pokemon.name[language]"
      class="h-24 object-contain mb-2"
      loading="lazy"
    />
    <p class="text-white font-semibold text-lg text-center">
      {{ pokemon.name[language] }}
    </p>
    <p class="text-gray-400 text-sm">
      #{{ pokemon.pokedex_id.toString().padStart(3, "0") }}
    </p>
    <div v-if="pokemon.types" class="flex gap-2 mt-2">
      <span
        v-for="type in pokemon.types"
        :key="type.name"
        :class="[
          getTypeColor(type.name),
          'px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md',
        ]"
      >
        {{ type.name }}
      </span>
    </div>
  </div>
</template>
