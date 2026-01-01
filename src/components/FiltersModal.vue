<script setup lang="ts">
import { ref, watch } from "vue";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { useTranslation } from "@/composables/useTranslation";

interface Props {
  isOpen: boolean;
}

interface SortOption {
  field: string;
  order: "asc" | "desc";
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  applyFilters: [filters: {
    generations: number[];
    sortBy: SortOption | null;
  }];
}>();

const { t } = useTranslation();
const modalRef = ref<HTMLElement | null>(null);
const isActiveModal = ref(false);

// Focus trap for accessibility
useFocusTrap(modalRef, isActiveModal, () => emit("close"));

// Filter states
const selectedGenerations = ref<number[]>([]);
const sortField = ref<string>("");
const sortOrder = ref<"asc" | "desc">("asc");

const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Toggle generation selection
const toggleGeneration = (gen: number) => {
  const index = selectedGenerations.value.indexOf(gen);
  if (index > -1) {
    selectedGenerations.value.splice(index, 1);
  } else {
    selectedGenerations.value.push(gen);
  }
};

// Select/deselect all generations
const selectAllGenerations = () => {
  if (selectedGenerations.value.length === generations.length) {
    selectedGenerations.value = [];
  } else {
    selectedGenerations.value = [...generations];
  }
};

// Reset all filters
const resetFilters = () => {
  selectedGenerations.value = [];
  sortField.value = "";
  sortOrder.value = "asc";
};

// Apply filters
const applyFilters = () => {
  const sortBy = sortField.value
    ? { field: sortField.value, order: sortOrder.value }
    : null;

  // Si on trie par stats et qu'on n'a pas explicitement sélectionné de générations,
  // on veut toutes les générations
  emit("applyFilters", {
    generations: selectedGenerations.value,
    sortBy,
  });
  emit("close");
};

// Handle escape key
watch(
  () => props.isOpen,
  (isOpen) => {
    isActiveModal.value = isOpen;
    if (isOpen && modalRef.value) {
      modalRef.value.focus();
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        :aria-label="t('filters.advanced.title')"
      >
        <div
          ref="modalRef"
          class="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30"
          tabindex="-1"
        >
          <!-- Header -->
          <div
            class="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl flex justify-between items-center"
          >
            <h2 class="text-2xl md:text-3xl font-bold text-white">
              {{ t("filters.advanced.title") }}
            </h2>
            <button
              @click="$emit('close')"
              class="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              :aria-label="t('buttons.close')"
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
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6">
            <!-- Generation Filter -->
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold text-white">
                  {{ t("filters.advanced.generation") }}
                </h3>
                <button
                  @click="selectAllGenerations"
                  class="text-sm text-purple-400 hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                >
                  {{
                    selectedGenerations.length === generations.length
                      ? t("filters.advanced.deselectAll")
                      : t("filters.advanced.selectAll")
                  }}
                </button>
              </div>

              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <button
                  v-for="gen in generations"
                  :key="gen"
                  @click="toggleGeneration(gen)"
                  :class="[
                    'px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus:ring-2 focus:ring-purple-500',
                    selectedGenerations.includes(gen)
                      ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/50'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-purple-500',
                  ]"
                  :aria-pressed="selectedGenerations.includes(gen)"
                >
                  Gen {{ gen }}
                </button>
              </div>
              
              <!-- Info message -->
              <p class="text-sm text-gray-400 italic">
                💡 {{ t("filters.advanced.generationInfo") }}
              </p>
            </div>

            <!-- Sort Options -->
            <div class="space-y-3">
              <h3 class="text-xl font-semibold text-white">
                {{ t("filters.advanced.sortBy") }}
              </h3>

              <div class="space-y-4">
                <!-- Sort Field -->
                <div>
                  <label for="sort-field" class="block text-sm text-gray-300 mb-2">
                    {{ t("filters.advanced.sortField") }}
                  </label>
                  <select
                    id="sort-field"
                    v-model="sortField"
                    class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">{{ t("filters.sort.none") }}</option>
                    <option value="pokedex_id">{{ t("filters.sort.pokedexId") }}</option>
                    <option value="name">{{ t("filters.sort.name") }}</option>
                    <option value="hp">{{ t("filters.sort.hp") }}</option>
                    <option value="atk">{{ t("filters.sort.attack") }}</option>
                    <option value="def">{{ t("filters.sort.defense") }}</option>
                    <option value="spe_atk">{{ t("filters.sort.specialAttack") }}</option>
                    <option value="spe_def">{{ t("filters.sort.specialDefense") }}</option>
                    <option value="vit">{{ t("filters.sort.speed") }}</option>
                  </select>
                </div>

                <!-- Sort Order -->
                <div v-if="sortField">
                  <label class="block text-sm text-gray-300 mb-2">
                    {{ t("filters.advanced.sortOrder") }}
                  </label>
                  <div class="flex gap-3">
                    <button
                      @click="sortOrder = 'asc'"
                      :class="[
                        'flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus:ring-2 focus:ring-purple-500',
                        sortOrder === 'asc'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-purple-500',
                      ]"
                      :aria-pressed="sortOrder === 'asc'"
                    >
                      <span class="flex items-center justify-center gap-2">
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        {{ t("filters.advanced.ascending") }}
                      </span>
                    </button>
                    <button
                      @click="sortOrder = 'desc'"
                      :class="[
                        'flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus:ring-2 focus:ring-purple-500',
                        sortOrder === 'desc'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-purple-500',
                      ]"
                      :aria-pressed="sortOrder === 'desc'"
                    >
                      <span class="flex items-center justify-center gap-2">
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        {{ t("filters.advanced.descending") }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm p-6 rounded-b-2xl border-t border-gray-700 flex flex-col sm:flex-row gap-3"
          >
            <button
              @click="resetFilters"
              class="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {{ t("filters.advanced.reset") }}
            </button>
            <button
              @click="applyFilters"
              class="flex-1 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {{ t("filters.advanced.apply") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}
</style>
