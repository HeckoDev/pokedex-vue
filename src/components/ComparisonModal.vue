<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { useFocusTrap } from "@/composables/useFocusTrap";
import { useTranslation, type TranslationKey } from "@/composables/useTranslation";
import { getTypeColor } from "@/utils/typeColors";
import { getTypeLabel } from "@/utils/pokemonI18n";
import {
  STAT_KEYS,
  compareStat,
  compareValues,
  parseMeasure,
  statTotal,
  type StatKey,
  type Winner,
} from "@/utils/comparison";

const props = defineProps<{
  isOpen: boolean;
  pokemons: Pokemon[];
  language: Language;
  isShiny: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const { t } = useTranslation();
const modalRef = ref<HTMLElement | null>(null);
const isActive = ref(false);

useFocusTrap(modalRef, isActive, () => emit("close"));

watch(
  () => props.isOpen,
  (open) => {
    isActive.value = open;
    if (open) modalRef.value?.focus();
  },
  { immediate: true }
);

const pair = computed(() => (props.pokemons.length === 2 ? (props.pokemons as [Pokemon, Pokemon]) : null));

const STAT_LABELS: Record<StatKey, TranslationKey> = {
  hp: "modal.hp",
  atk: "modal.attack",
  def: "modal.defense",
  spe_atk: "modal.spAttack",
  spe_def: "modal.spDefense",
  vit: "modal.speed",
};

const sprite = (p: Pokemon) =>
  props.isShiny && p.sprites.shiny ? p.sprites.shiny : p.sprites.regular;

const statValue = (p: Pokemon, key: StatKey) => p.stats?.[key] ?? 0;

interface StatRow {
  id: string;
  label: string;
  a: number;
  b: number;
  winner: Winner;
  max: number;
}

const rows = computed(() => {
  const [a, b] = pair.value ?? [];
  if (!a || !b) return [];
  const stats: StatRow[] = STAT_KEYS.map((key) => ({
    id: key,
    label: t(STAT_LABELS[key]),
    a: statValue(a, key),
    b: statValue(b, key),
    winner: compareStat(a, b, key),
    max: 255,
  }));
  const totalA = statTotal(a.stats);
  const totalB = statTotal(b.stats);
  stats.push({
    id: "total",
    label: t("compare.total"),
    a: totalA,
    b: totalB,
    winner: compareValues(totalA, totalB),
    max: 800,
  });
  return stats;
});

const measures = computed(() => {
  const [a, b] = pair.value ?? [];
  if (!a || !b) return [];
  return [
    {
      id: "height",
      label: t("modal.height"),
      a: a.height ?? "—",
      b: b.height ?? "—",
      winner: compareValues(parseMeasure(a.height), parseMeasure(b.height)),
    },
    {
      id: "weight",
      label: t("modal.weight"),
      a: a.weight ?? "—",
      b: b.weight ?? "—",
      winner: compareValues(parseMeasure(a.weight), parseMeasure(b.weight)),
    },
  ];
});

const abilities = (p: Pokemon) =>
  p.talents?.map((tl) => `${tl.names?.[props.language] ?? tl.name}${tl.tc ? ` ${t("modal.hiddenAbility")}` : ""}`) ?? [];

const isWinner = (winner: Winner, side: "a" | "b") => winner === side;
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen && pair"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-title"
        data-testid="comparison-modal"
        @click.self="emit('close')"
      >
        <div
          ref="modalRef"
          tabindex="-1"
          class="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-surface-border focus:outline-none"
        >
          <div
            class="sticky top-0 z-10 bg-gradient-to-r from-pokedex-red to-pokedex-red-dark p-5 rounded-t-2xl flex justify-between items-center"
          >
            <h2 id="comparison-title" class="text-2xl font-bold text-white">
              {{ t("compare.title") }}
            </h2>
            <button
              type="button"
              class="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              :aria-label="t('buttons.close')"
              @click="emit('close')"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-5 sm:p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <section
                v-for="p in pair"
                :key="p.pokedex_id"
                class="rounded-2xl bg-white/5 p-4 flex flex-col items-center text-center"
                :aria-label="p.name[language]"
              >
                <img :src="sprite(p)" :alt="p.name[language]" class="h-32 w-32 sm:h-40 sm:w-40 object-contain" />
                <h3 class="text-xl font-bold text-white mt-2">{{ p.name[language] }}</h3>
                <p class="text-content-muted text-sm">#{{ p.pokedex_id.toString().padStart(3, "0") }}</p>
                <ul v-if="p.types" class="flex gap-2 mt-2 flex-wrap justify-center" :aria-label="t('aria.pokemonTypes')">
                  <li
                    v-for="type in p.types"
                    :key="type.name"
                    :class="[getTypeColor(type.name), 'px-3 py-1 rounded-full text-xs font-semibold text-white']"
                  >
                    {{ getTypeLabel(type.name, language) }}
                  </li>
                </ul>
              </section>
            </div>

            <table class="w-full text-white" data-testid="comparison-table">
              <caption class="sr-only">{{ t("compare.caption") }}</caption>
              <thead>
                <tr>
                  <th scope="col" class="sr-only">{{ t("compare.stat") }}</th>
                  <th v-for="p in pair" :key="p.pokedex_id" scope="col" class="sr-only">
                    {{ p.name[language] }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in rows"
                  :key="row.id"
                  :data-testid="`compare-row-${row.id}`"
                  :class="['border-t border-white/10', row.id === 'total' ? 'font-bold' : '']"
                >
                  <th scope="row" class="py-2 pr-2 text-left text-sm text-content-muted font-semibold w-1/4">
                    {{ row.label }}
                  </th>
                  <td
                    v-for="side in (['a', 'b'] as const)"
                    :key="side"
                    :data-winner="isWinner(row.winner, side)"
                    class="py-2 px-2 align-middle"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        :class="['w-10 text-right tabular-nums', isWinner(row.winner, side) ? 'text-green-400 font-bold' : '']"
                      >
                        {{ row[side] }}
                      </span>
                      <span v-if="isWinner(row.winner, side)" aria-hidden="true" class="text-green-400">▲</span>
                      <span v-if="isWinner(row.winner, side)" class="sr-only">{{ t("compare.higher") }}</span>
                      <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                        <div
                          :class="['h-full rounded-full', isWinner(row.winner, side) ? 'bg-green-400' : 'bg-white/40']"
                          :style="{ width: Math.min(100, (row[side] / row.max) * 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr v-for="m in measures" :key="m.id" class="border-t border-white/10">
                  <th scope="row" class="py-2 pr-2 text-left text-sm text-content-muted font-semibold">
                    {{ m.label }}
                  </th>
                  <td
                    v-for="side in (['a', 'b'] as const)"
                    :key="side"
                    :data-winner="isWinner(m.winner, side)"
                    class="py-2 px-2"
                  >
                    <span :class="isWinner(m.winner, side) ? 'text-green-400 font-bold' : ''">{{ m[side] }}</span>
                    <template v-if="isWinner(m.winner, side)">
                      <span aria-hidden="true" class="text-green-400"> ▲</span>
                      <span class="sr-only">{{ t("compare.higher") }}</span>
                    </template>
                  </td>
                </tr>

                <tr class="border-t border-white/10">
                  <th scope="row" class="py-2 pr-2 text-left text-sm text-content-muted font-semibold">
                    {{ t("modal.abilities") }}
                  </th>
                  <td v-for="p in pair" :key="p.pokedex_id" class="py-2 px-2 text-sm">
                    <ul>
                      <li v-for="name in abilities(p)" :key="name">{{ name }}</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
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
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active {
    transition: none;
  }
}
</style>
