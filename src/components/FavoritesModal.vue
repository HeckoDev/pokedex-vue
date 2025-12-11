<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="close"
    >
      <div
        class="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Title -->
        <h2 class="text-3xl font-bold mb-6 text-white flex items-center gap-3">
          <svg
            class="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {{ t('favorites.title') }}
        </h2>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"
          ></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="favorites.length === 0" class="text-center py-12">
          <svg
            class="w-20 h-20 text-gray-600 mx-auto mb-4"
            fill="none"
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
          <p class="text-gray-400 text-lg">{{ t('favorites.empty') }}</p>
          <p class="text-gray-500 text-sm mt-2">
            {{ t('favorites.emptyHint') }}
          </p>
        </div>

        <!-- Favorites grid -->
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          <div
            v-for="favorite in favoritesWithData"
            :key="favorite.id"
            class="bg-gray-800 rounded-lg p-4 relative group"
          >
            <!-- Remove button -->
            <button
              @click="handleRemoveFavorite(favorite.pokemon_id)"
              class="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg
                class="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- Pokemon card -->
            <div v-if="favorite.pokemonData" class="flex flex-col items-center">
              <img
                :src="favorite.pokemonData.sprites.regular"
                :alt="favorite.pokemonData.name.fr"
                class="h-24 object-contain mb-2"
              />
              <p class="text-white font-semibold text-center">
                {{ favorite.pokemonData.name.fr }}
              </p>
              <p class="text-gray-400 text-sm">
                #{{ favorite.pokemon_id.toString().padStart(3, "0") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useFavorites } from "@/composables/useFavorites";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { favorites, loading, removeFavorite, fetchFavorites } = useFavorites();
const { allPokemons } = usePokemon();
const { t } = useTranslation();

const favoritesWithData = computed(() => {
  return favorites.value.map((fav) => ({
    ...fav,
    pokemonData: allPokemons.value.find((p) => p.pokedex_id === fav.pokemon_id),
  }));
});

const handleRemoveFavorite = async (pokemonId: number) => {
  await removeFavorite(pokemonId);
};

const close = () => {
  emit("close");
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      fetchFavorites();
    }
  }
);
</script>
