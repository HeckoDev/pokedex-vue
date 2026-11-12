<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorites-modal-title"
        @click.self="close"
      >
        <div
          ref="modalRef"
          tabindex="-1"
          class="bg-surface-overlay rounded-modal shadow-e4 w-full max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain p-6 relative"
        >
          <!-- Close button -->
          <button
            class="absolute top-4 right-4 p-2 rounded-full text-content-muted hover:text-content-strong hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            :aria-label="t('buttons.close')"
            @click="close"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

          <!-- Title -->
          <h2
            id="favorites-modal-title"
            class="text-3xl font-bold mb-6 text-content-strong flex items-center gap-3"
          >
            <svg
              class="w-8 h-8 text-pokedex-red"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
              class="motion-safe:animate-spin rounded-full h-12 w-12 border-b-2 border-content-strong mx-auto"
            ></div>
          </div>

          <!-- Empty state -->
          <div v-else-if="favorites.length === 0" class="text-center py-12">
            <svg
              class="w-20 h-20 text-content-subtle mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p class="text-content-muted text-lg">{{ t('favorites.empty') }}</p>
            <p class="text-content-subtle text-sm mt-2">
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
              class="bg-surface-raised rounded-card p-4 relative group shadow-e2"
            >
              <!-- Remove button (always visible / focus-visible) -->
              <button
                class="absolute top-2 right-2 p-2 bg-danger hover:bg-pokedex-red-dark rounded-full opacity-100 sm:opacity-70 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                :aria-label="t('favorites.remove', { name: favorite.pokemonData ? favorite.pokemonData.name.fr : String(favorite.pokemon_id) })"
                @click="handleRemoveFavorite(favorite.pokemon_id)"
              >
                <svg
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

              <!-- Pokemon card -->
              <div v-if="favorite.pokemonData" class="flex flex-col items-center">
                <img
                  :src="favorite.pokemonData.sprites.regular"
                  :alt="favorite.pokemonData.name.fr"
                  class="h-24 object-contain mb-2"
                />
                <p class="text-content-strong font-semibold text-center">
                  {{ favorite.pokemonData.name.fr }}
                </p>
                <p class="text-content-muted text-sm">
                  #{{ favorite.pokemon_id.toString().padStart(3, "0") }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useFavorites } from "@/composables/useFavorites";
import { usePokemon } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { useFocusTrap } from "@/composables/useFocusTrap";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { favorites, loading, removeFavorite, fetchFavorites } = useFavorites();
const { allPokemons } = usePokemon();
const { t } = useTranslation();

// Accessible dialog: focus trap + Escape handling
const modalRef = ref<HTMLElement | null>(null);
const isOpenRef = ref(false);
useFocusTrap(modalRef, isOpenRef, () => emit("close"));

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
    isOpenRef.value = newValue;
    if (newValue) {
      fetchFavorites();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.modal-enter-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.96);
}
</style>
