import { ref, computed, onMounted } from "vue";
import type { Pokemon } from "@/types/pokemon";
import { fetchPokemonDetails, fetchPokemonSpecies } from "@/services/pokeapi";
import { transformPokemon } from "@/services/pokeapi-transform";
import pokedexData from "@/data/pokedex.json";

export type Language = "fr" | "en" | "jp";

export function usePokemon() {
  const pokemons = ref<Pokemon[]>([]);
  const searchQuery = ref("");
  const selectedType = ref<string>("");
  const selectedLanguage = ref<Language>("fr");
  const isShiny = ref(false);
  
  const isLoading = ref(false);
  const loadingProgress = ref({ loaded: 0, total: 0 });
  const error = ref<string | null>(null);

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
  };
}
