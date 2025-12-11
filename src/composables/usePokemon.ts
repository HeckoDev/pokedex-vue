import { ref, computed } from "vue";
import type { Pokemon } from "@/types/pokemon";
import pokedexData from "@/data/pokedex.json";

export type Language = "fr" | "en" | "jp";

export function usePokemon() {
  const pokemons = ref<Pokemon[]>(pokedexData as Pokemon[]);
  const searchQuery = ref("");
  const selectedType = ref<string>("");
  const selectedLanguage = ref<Language>("fr");
  const isShiny = ref(false);

  // Filter Pokémon based on search and type
  const filteredPokemons = computed(() => {
    return pokemons.value.filter((pokemon) => {
      const matchesSearch = pokemon.name[selectedLanguage.value]
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

      const matchesType =
        selectedType.value === "" ||
        pokemon.types?.some((type) => type.name === selectedType.value);

      return matchesSearch && matchesType;
    });
  });

  // Group Pokémon by generation
  const pokemonsByGeneration = computed(() => {
    const grouped = new Map<number, Pokemon[]>();

    filteredPokemons.value.forEach((pokemon) => {
      const gen = pokemon.generation;
      if (!grouped.has(gen)) {
        grouped.set(gen, []);
      }
      grouped.get(gen)!.push(pokemon);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, pokemons]) => ({ generation, pokemons }));
  });

  // Get all unique types
  const allTypes = computed(() => {
    const types = new Set<string>();
    pokemons.value.forEach((pokemon) => {
      pokemon.types?.forEach((type) => types.add(type.name));
    });
    return Array.from(types).sort();
  });

  const getPokemonById = (id: number): Pokemon | undefined => {
    return pokemons.value.find((p) => p.pokedex_id === id);
  };

  return {
    pokemons,
    allPokemons: pokemons,
    searchQuery,
    selectedType,
    selectedLanguage,
    isShiny,
    filteredPokemons,
    pokemonsByGeneration,
    allTypes,
    getPokemonById,
  };
}
