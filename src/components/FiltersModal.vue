<script setup lang="ts">
import { ref, watch } from "vue";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { useTranslation, type TranslationKey } from "@/composables/useTranslation";
import { usePokemon } from "@/composables/usePokemon";
import {
  FORM_FILTERS,
  RARITY_FILTERS,
  STAGE_FILTERS,
  emptyExtraFilters,
  type ExtraFilters,
} from "@/utils/pokemonFilters";

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
    extra: ExtraFilters;
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

const extra = ref<ExtraFilters>(emptyExtraFilters());

const extraGroups = [
  { key: "forms", options: FORM_FILTERS, label: "filters.advanced.forms", prefix: "filters.forms." },
  { key: "rarities", options: RARITY_FILTERS, label: "filters.advanced.rarity", prefix: "filters.rarity." },
  { key: "stages", options: STAGE_FILTERS, label: "filters.advanced.stage", prefix: "filters.stage." },
] as const;

const optionLabel = (prefix: string, opt: string) => `${prefix}${opt}` as TranslationKey;

const toggleExtra = (key: keyof ExtraFilters, value: string) => {
  const list = extra.value[key] as string[];
  const i = list.indexOf(value);
  if (i > -1) list.splice(i, 1);
  else list.push(value);
};

const isExtraActive = (key: keyof ExtraFilters, value: string) =>
  (extra.value[key] as string[]).includes(value);

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
  extra.value = emptyExtraFilters();
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
    extra: extra.value,
  });
  emit("close");
};

// Re-read the applied filters so the dialog never shows stale choices
const { selectedGenerations: applied, sortBy: appliedSort, extraFilters } = usePokemon();
const syncFromApplied = () => {
  selectedGenerations.value = [...applied.value];
  sortField.value = appliedSort.value?.field ?? "";
  sortOrder.value = appliedSort.value?.order ?? "asc";
  extra.value = {
    forms: [...extraFilters.value.forms],
    rarities: [...extraFilters.value.rarities],
    stages: [...extraFilters.value.stages],
  };
};

// Handle escape key
watch(
  () => props.isOpen,
  (isOpen) => {
    isActiveModal.value = isOpen;
    if (isOpen) syncFromApplied();
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
          class="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-surface-border"
          tabindex="-1"
        >
          <!-- Header -->
          <div
            class="sticky top-0 bg-gradient-to-r from-pokedex-red to-pokedex-red-dark p-6 rounded-t-2xl flex justify-between items-center"
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
                  class="text-sm text-pokedex-red hover:brightness-125 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded px-2 py-1"
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
                    'px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                    selectedGenerations.includes(gen)
                      ? 'bg-pokedex-red text-white border-pokedex-red shadow-glow'
                      : 'bg-surface-hover text-content-muted border-surface-border hover:border-pokedex-red',
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

            <!-- Forms / rarity / evolution stage -->
            <fieldset
              v-for="group in extraGroups"
              :key="group.key"
              class="space-y-3"
              :data-testid="`filter-${group.key}`"
            >
              <legend class="text-xl font-semibold text-white mb-3">
                {{ t(group.label as TranslationKey) }}
              </legend>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="opt in group.options"
                  :key="opt"
                  type="button"
                  @click="toggleExtra(group.key, opt)"
                  :class="[
                    'px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                    isExtraActive(group.key, opt)
                      ? 'bg-pokedex-red text-white border-pokedex-red shadow-glow'
                      : 'bg-surface-hover text-content-muted border-surface-border hover:border-pokedex-red',
                  ]"
                  :aria-pressed="isExtraActive(group.key, opt)"
                >
                  {{ t(optionLabel(group.prefix, opt)) }}
                </button>
              </div>
            </fieldset>

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
                    class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus:border-pokedex-red"
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
                        'flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                        sortOrder === 'asc'
                          ? 'bg-pokedex-red text-white border-pokedex-red'
                          : 'bg-surface-hover text-content-muted border-surface-border hover:border-pokedex-red',
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
                        'flex-1 px-4 py-3 rounded-lg font-semibold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                        sortOrder === 'desc'
                          ? 'bg-pokedex-red text-white border-pokedex-red'
                          : 'bg-surface-hover text-content-muted border-surface-border hover:border-pokedex-red',
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
            class="sticky bottom-0 bg-gray-800/95 backdrop-blur-sm p-6 rounded-b-2xl border-t border-surface-border shadow-e4 flex flex-col sm:flex-row gap-3"
          >
            <button
              @click="resetFilters"
              class="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {{ t("filters.advanced.reset") }}
            </button>
            <button
              @click="applyFilters"
              class="flex-1 px-6 py-3 rounded-lg font-semibold bg-pokedex-red text-white hover:bg-pokedex-red-dark transition-colors shadow-e2 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
