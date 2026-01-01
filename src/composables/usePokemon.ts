import { ref, computed, onMounted } from "vue";
import type { Pokemon, Stats } from "@/types/pokemon";
import { fetchPokemonDetails, fetchPokemonSpecies } from "@/services/pokeapi";
import { transformPokemon } from "@/services/pokeapi-transform";
import pokedexData from "@/data/pokedex.json";

export type Language = "fr" | "en" | "jp";

export interface SortOption {
  field: string;
  order: "asc" | "desc";
}

// Shared state (singleton pattern)
const pokemons = ref<Pokemon[]>([]);
const searchQuery = ref("");
const selectedType = ref<string>("");
const selectedLanguage = ref<Language>("fr");
const isShiny = ref(false);

const isLoading = ref(false);
const loadingProgress = ref({ loaded: 0, total: 0 });
const error = ref<string | null>(null);

// Advanced filters
const selectedGenerations = ref<number[]>([]);
const sortBy = ref<SortOption | null>(null);

export function usePokemon() {

  // Load Pokemon from local JSON (fast initial load)
  const loadPokemons = async () => {
    if (pokemons.value.length > 0) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      pokemons.value = pokedexData as Pokemon[];
      loadingProgress.value = { loaded: pokemons.value.length, total: pokemons.value.length };
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Error loading Pokemon";
      console.error("Error loading Pokemon:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Enrich Pokemon with API data (evolutions, forms, etc.)
  const enrichPokemonFromAPI = async (pokemon: Pokemon): Promise<Pokemon> => {
    try {
      const [apiPokemon, species] = await Promise.all([
        fetchPokemonDetails(pokemon.pokedex_id),
        fetchPokemonSpecies(pokemon.pokedex_id)
      ]);
      
      return await transformPokemon(apiPokemon, species, pokemon);
    } catch (err) {
      console.error(`Error enriching Pokemon ${pokemon.pokedex_id}:`, err);
      return pokemon;
    }
  };

  onMounted(() => {
    loadPokemons();
  });

  const filteredPokemons = computed(() => {
    let filtered = pokemons.value.filter((pokemon) => {
      const matchesSearch = pokemon.name[selectedLanguage.value]
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

      const matchesType =
        selectedType.value === "" ||
        pokemon.types?.some((type) => type.name === selectedType.value);

      const matchesGeneration =
        selectedGenerations.value.length === 0 ||
        selectedGenerations.value.includes(pokemon.generation);

      return matchesSearch && matchesType && matchesGeneration;
    });

    // Apply sorting
    if (sortBy.value) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // Handle different sort fields
        if (sortBy.value!.field === "name") {
          aValue = a.name[selectedLanguage.value].toLowerCase();
          bValue = b.name[selectedLanguage.value].toLowerCase();
        } else if (sortBy.value!.field === "pokedex_id") {
          aValue = a.pokedex_id;
          bValue = b.pokedex_id;
        } else if (a.stats && b.stats) {
          // Sort by stats
          const field = sortBy.value!.field;
          const validStatsFields = ['hp', 'atk', 'def', 'spe_atk', 'spe_def', 'vit'];
          if (validStatsFields.includes(field)) {
            aValue = a.stats[field as keyof Stats] ?? 0;
            bValue = b.stats[field as keyof Stats] ?? 0;
          } else {
            return 0;
          }
        } else {
          return 0;
        }

        // Compare values
        if (aValue < bValue) {
          return sortBy.value!.order === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortBy.value!.order === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  });

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
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  });

  const getPokemonById = (id: number): Pokemon | undefined => {
    return pokemons.value.find((p) => p.pokedex_id === id);
  };

  // Apply advanced filters
  const applyAdvancedFilters = (filters: {
    generations: number[];
    sortBy: SortOption | null;
  }) => {
    selectedGenerations.value = filters.generations;
    sortBy.value = filters.sortBy;
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
    enrichPokemonFromAPI,
    // Nouveaux exports pour l'état de chargement
    isLoading,
    loadingProgress,
    error,
    loadPokemons,
    // Advanced filters
    selectedGenerations,
    sortBy,
    applyAdvancedFilters,
  };
}
