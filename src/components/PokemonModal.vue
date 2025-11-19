<script setup lang="ts">
import { computed } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { useTranslation } from "@/composables/useTranslation";
import { getTypeColor } from "@/utils/typeColors";

const { t } = useTranslation();

const props = defineProps<{
  pokemon: Pokemon | null;
  language: Language;
  isShiny: boolean;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const spriteUrl = computed(() => {
  if (!props.pokemon) return "";
  if (props.isShiny && props.pokemon.sprites.shiny) {
    return props.pokemon.sprites.shiny;
  }
  return props.pokemon.sprites.regular;
});

const closeModal = () => {
  emit("close");
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal();
  }
};
</script>

<template>
  <Transition name="modal">
    <div
      v-if="isOpen && pokemon"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click="handleBackdropClick"
    >
      <div
        class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl flex justify-between items-center"
        >
          <div class="flex items-center gap-4">
            <h2 class="text-white text-3xl font-bold">
              {{ pokemon.name[language] }}
            </h2>
            <span class="text-white/80 text-lg">
              #{{ pokemon.pokedex_id.toString().padStart(3, "0") }}
            </span>
          </div>
          <button
            @click="closeModal"
            class="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Fermer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Image et infos de base -->
          <div class="flex flex-col md:flex-row gap-6 items-center">
            <!-- Image -->
            <div class="flex-shrink-0">
              <div class="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <img
                  :src="spriteUrl"
                  :alt="pokemon.name[language]"
                  class="h-48 w-48 object-contain"
                />
              </div>
            </div>

            <!-- Infos de base -->
            <div class="flex-1 space-y-4 w-full">
              <!-- Types -->
              <div v-if="pokemon.types">
                <h3 class="text-white/60 text-sm font-semibold mb-2">Types</h3>
                <div class="flex gap-2">
                  <span
                    v-for="type in pokemon.types"
                    :key="type.name"
                    :class="[
                      getTypeColor(type.name),
                      'px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md',
                    ]"
                  >
                    {{ type.name }}
                  </span>
                </div>
              </div>

              <!-- Catégorie -->
              <div>
                <h3 class="text-white/60 text-sm font-semibold mb-1">
                  {{ t("modal.category") }}
                </h3>
                <p class="text-white text-lg">{{ pokemon.category }}</p>
              </div>

              <!-- Taille et poids -->
              <div class="grid grid-cols-2 gap-4">
                <div v-if="pokemon.height">
                  <h3 class="text-white/60 text-sm font-semibold mb-1">
                    {{ t("modal.height") }}
                  </h3>
                  <p class="text-white text-lg">{{ pokemon.height }}</p>
                </div>
                <div v-if="pokemon.weight">
                  <h3 class="text-white/60 text-sm font-semibold mb-1">
                    {{ t("modal.weight") }}
                  </h3>
                  <p class="text-white text-lg">{{ pokemon.weight }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistiques -->
          <div v-if="pokemon.stats" class="bg-white/5 rounded-2xl p-6">
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.stats") }}
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{ t("modal.hp") }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.hp
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-green-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.hp / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.attack")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.atk
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-red-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.atk / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.defense")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.def
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-blue-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.def / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.spAttack")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.spe_atk
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-purple-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.spe_atk / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.spDefense")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.spe_def
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-yellow-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.spe_def / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <span class="text-white/80 text-sm">{{
                    t("modal.speed")
                  }}</span>
                  <span class="text-white font-semibold">{{
                    pokemon.stats.vit
                  }}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-pink-500 rounded-full h-2 transition-all"
                    :style="{
                      width: `${Math.min(
                        (pokemon.stats.vit / 255) * 100,
                        100
                      )}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Talents -->
          <div
            v-if="pokemon.talents && pokemon.talents.length > 0"
            class="bg-white/5 rounded-2xl p-6"
          >
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.abilities") }}
            </h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="talent in pokemon.talents"
                :key="talent.name"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  talent.tc
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-white',
                ]"
              >
                {{ talent.name }}
                <span v-if="talent.tc" class="ml-1 text-xs">{{
                  t("modal.hiddenAbility")
                }}</span>
              </span>
            </div>
          </div>

          <!-- Évolutions -->
          <div
            v-if="
              pokemon.evolution &&
              (pokemon.evolution.pre || pokemon.evolution.next)
            "
            class="bg-white/5 rounded-2xl p-6"
          >
            <h3 class="text-white text-xl font-bold mb-4">
              {{ t("modal.evolutions") }}
            </h3>
            <div class="space-y-4">
              <!-- Pré-évolutions -->
              <div
                v-if="pokemon.evolution.pre && pokemon.evolution.pre.length > 0"
              >
                <h4 class="text-white/60 text-sm font-semibold mb-2">
                  {{ t("modal.preEvolution") }}
                </h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="pre in pokemon.evolution.pre"
                    :key="pre.pokedex_id"
                    class="bg-white/10 rounded-lg p-3"
                  >
                    <p class="text-white font-medium">{{ pre.name }}</p>
                    <p class="text-white/60 text-xs">{{ pre.condition }}</p>
                  </div>
                </div>
              </div>

              <!-- Évolutions suivantes -->
              <div
                v-if="
                  pokemon.evolution.next && pokemon.evolution.next.length > 0
                "
              >
                <h4 class="text-white/60 text-sm font-semibold mb-2">
                  {{ t("modal.evolution") }}
                </h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="next in pokemon.evolution.next"
                    :key="next.pokedex_id"
                    class="bg-white/10 rounded-lg p-3"
                  >
                    <p class="text-white font-medium">{{ next.name }}</p>
                    <p class="text-white/60 text-xs">{{ next.condition }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
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

.modal-enter-active .bg-gradient-to-br,
.modal-leave-active .bg-gradient-to-br {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-gradient-to-br,
.modal-leave-to .bg-gradient-to-br {
  transform: scale(0.9);
}
</style>
