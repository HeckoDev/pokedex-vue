<script setup lang="ts">
import { computed } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { getTypeColor } from "@/utils/typeColors";

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
}>();
</script>

<template>
  <div
    @click="emit('click')"
    class="bg-gray-800 rounded-2xl p-4 shadow-lg flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-pointer hover:shadow-2xl"
  >
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
