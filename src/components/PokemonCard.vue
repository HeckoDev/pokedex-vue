<script setup lang="ts">
import { computed } from "vue";
import type { Pokemon } from "@/types/pokemon";
import type { Language } from "@/composables/usePokemon";
import { getTypeColor } from "@/utils/typeColors";
import { getTypeLabel } from "@/utils/pokemonI18n";
import { useAuth } from "@/composables/useAuth";
import { useFavorites } from "@/composables/useFavorites";
import { useTranslation, type TranslationKey } from "@/composables/useTranslation";
import { getFormDisplay, type FormFilter } from "@/utils/pokemonFilters";

const props = defineProps<{
  pokemon: Pokemon;
  language: Language;
  isShiny: boolean;
  // Forms selected in the filters: the card then shows the matching form
  activeForms?: FormFilter[];
  // Compare mode: a click toggles the selection instead of opening the modal
  compareMode?: boolean;
  compareSelected?: boolean;
}>();

const { t } = useTranslation();

const formDisplay = computed(() =>
  props.activeForms?.length ? getFormDisplay(props.pokemon, props.activeForms, props.isShiny) : null
);

const formLabel = computed(() =>
  formDisplay.value ? t(`filters.forms.${formDisplay.value.form}` as TranslationKey) : ""
);

const spriteUrl = computed(() => {
  if (formDisplay.value) return formDisplay.value.sprite;
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
  <article
    data-testid="pokemon-card"
    :class="[
      'group bg-surface-overlay rounded-card p-4 shadow-e2 hover:shadow-e3 flex flex-col items-center transition-shadow duration-200 relative overflow-hidden',
    ]"
  >
    <span
      v-if="compareSelected"
      class="absolute inset-0 z-20 rounded-card border-2 border-pokedex-red pointer-events-none"
      aria-hidden="true"
    ></span>
    <span
      v-if="compareSelected"
      data-testid="compare-check"
      class="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-pokedex-red text-white flex items-center justify-center font-bold pointer-events-none"
      aria-hidden="true"
    >✓</span>
    <!-- Type-colored top accent bar -->
    <div
      v-if="pokemon.types && pokemon.types.length"
      :class="[getTypeColor(pokemon.types[0].name), 'absolute top-0 inset-x-0 h-1.5 pointer-events-none']"
      aria-hidden="true"
    ></div>

    <!-- Full-size overlay button provides the 'open' action (behind content) -->
    <button
      type="button"
      class="card-open absolute inset-0 z-0 cursor-pointer rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      :aria-pressed="compareMode ? !!compareSelected : undefined"
      :aria-label="compareMode ? t('compare.toggle', { name: pokemon.name[language] }) : t('aria.pokemonCardLabel', { name: pokemon.name[language], id: pokemon.pokedex_id, types: pokemon.types?.map(type => getTypeLabel(type.name, language)).join(', ') ?? '' })"
      @click="emit('click')"
@keydown.enter="emit('click')"
      @keydown.space.prevent="emit('click')"
    ></button>

    <!-- Favorite button — sits above the overlay, not nested in it -->
    <button
      v-if="isAuthenticated"
      type="button"
      :aria-label="isFavorite(pokemon.pokedex_id) ? t('aria.removeFavorite', { name: pokemon.name[language] }) : t('aria.addFavorite', { name: pokemon.name[language] })"
      :aria-pressed="isFavorite(pokemon.pokedex_id)"
      class="favorite-btn absolute top-2 right-2 z-10 p-2.5 rounded-full hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      :class="isFavorite(pokemon.pokedex_id) ? 'text-red-500' : 'text-content-muted'"
      @click.stop="handleFavoriteClick"
    >
      <svg
        class="w-5 h-5 motion-safe:group-active:animate-pop"
        :fill="isFavorite(pokemon.pokedex_id) ? 'currentColor' : 'none'"
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
    </button>

    <img
      :src="spriteUrl"
      :alt="`${pokemon.name[language]} sprite${formLabel ? ` (${formLabel})` : ''}`"
      class="h-24 object-contain mb-2 pointer-events-none motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
      loading="lazy"
    />
    <span
      v-if="formLabel"
      data-testid="card-form-badge"
      class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pokedex-red text-white text-xs font-bold pointer-events-none"
    >
      {{ formLabel }}
    </span>
    <p
      class="text-content-strong font-semibold text-lg text-center line-clamp-1 pointer-events-none"
      :title="pokemon.name[language]"
    >
      {{ pokemon.name[language] }}
    </p>
    <p class="text-content-muted text-sm pointer-events-none">
      #{{ pokemon.pokedex_id.toString().padStart(3, "0") }}
    </p>
    <div v-if="pokemon.types" class="flex gap-2 mt-2 pointer-events-none" role="list" :aria-label="t('aria.pokemonTypes')">
      <span
        v-for="type in pokemon.types"
        :key="type.name"
        role="listitem"
        :class="[
          getTypeColor(type.name),
          'px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md',
        ]"
      >
        {{ getTypeLabel(type.name, language) }}
      </span>
    </div>
  </article>
</template>
