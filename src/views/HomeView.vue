<script setup lang="ts">
import PokemonList from "@/components/PokemonList.vue";

defineEmits<{
  openAuth: [];
  openFilters: [];
}>();
</script>

<template>
  <PokemonList @open-auth="$emit('openAuth')" @open-filters="$emit('openFilters')" />
</template>
