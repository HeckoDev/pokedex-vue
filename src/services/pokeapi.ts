// PokeAPI integration service - https://pokeapi.co/docs/v2

const BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_LIMIT = 1025;

// Cache to avoid repeated requests
const cache = new Map<string, any>();

// Fetch with cache support
async function fetchWithCache<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

// PokeAPI type definitions
export interface PokeAPIListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}

export interface PokeAPIPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    other: {
      'official-artwork': {
        front_default: string | null;
        front_shiny: string | null;
      };
      home: {
        front_default: string | null;
        front_shiny: string | null;
      };
    };
  };
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    is_hidden: boolean;
    ability: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeAPISpecies {
  id: number;
  name: string;
  generation: {
    name: string;
    url: string;
  };
  names: Array<{
    language: {
      name: string;
    };
    name: string;
  }>;
  genera: Array<{
    genus: string;
    language: {
      name: string;
    };
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
    };
  }>;
  evolution_chain: {
    url: string;
  };
  varieties: Array<{
    is_default: boolean;
    pokemon: {
      name: string;
      url: string;
    };
  }>;
}

export interface PokeAPIEvolutionChain {
  id: number;
  chain: PokeAPIEvolutionLink;
}

export interface PokeAPIEvolutionLink {
  species: {
    name: string;
    url: string;
  };
  evolution_details: Array<{
    min_level: number | null;
    item: { name: string; url: string } | null;
    trigger: { name: string; url: string };
    held_item: { name: string; url: string } | null;
    time_of_day: string;
    location: { name: string; url: string } | null;
    known_move: { name: string; url: string } | null;
    min_happiness: number | null;
    min_beauty: number | null;
    min_affection: number | null;
  }>;
  evolves_to: PokeAPIEvolutionLink[];
}

export interface PokeAPIPokemonForm {
  id: number;
  name: string;
  form_name: string;
  is_default: boolean;
  is_mega: boolean;
  is_battle_only: boolean;
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
}

/**
 * Récupère la liste de tous les Pokémon
 */
export async function fetchPokemonList(limit: number = POKEMON_LIMIT, offset: number = 0): Promise<PokeAPIListResponse> {
  return fetchWithCache(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
}

/**
 * Récupère les détails d'un Pokémon par son ID ou nom
 */
export async function fetchPokemonDetails(idOrName: string | number): Promise<PokeAPIPokemon> {
  return fetchWithCache(`${BASE_URL}/pokemon/${idOrName}`);
}

/**
 * Récupère les informations d'espèce d'un Pokémon (noms localisés, génération, etc.)
 */
export async function fetchPokemonSpecies(id: number): Promise<PokeAPISpecies> {
  return fetchWithCache(`${BASE_URL}/pokemon-species/${id}`);
}

/**
 * Récupère tous les Pokémon avec leurs détails complets
 * Cette fonction charge les données progressivement avec un délai pour éviter de surcharger l'API
 */
export async function fetchAllPokemon(
  limit: number = POKEMON_LIMIT,
  onProgress?: (loaded: number, total: number) => void
): Promise<Array<{ pokemon: PokeAPIPokemon; species: PokeAPISpecies }>> {
  const list = await fetchPokemonList(limit);
  const total = Math.min(limit, list.count);
  const results: Array<{ pokemon: PokeAPIPokemon; species: PokeAPISpecies }> = [];

  const batchSize = 20;
  for (let i = 0; i < total; i += batchSize) {
    const batch = list.results.slice(i, Math.min(i + batchSize, total));
    
    const batchPromises = batch.map(async (item) => {
      const pokemonId = parseInt(item.url.split('/').slice(-2, -1)[0]);
      const [pokemon, species] = await Promise.all([
        fetchPokemonDetails(pokemonId),
        fetchPokemonSpecies(pokemonId)
      ]);
      return { pokemon, species };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(results.length, total);
    }

    if (i + batchSize < total) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

// Extract generation number from generation name
export function getGenerationNumber(generationName: string): number {
  const match = generationName.match(/generation-(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

// Fetch evolution chain by ID
export async function fetchEvolutionChain(id: number): Promise<PokeAPIEvolutionChain> {
  return fetchWithCache(`${BASE_URL}/evolution-chain/${id}`);
}

// Fetch Pokemon form metadata
export async function fetchPokemonFormMetadata(nameOrId: string | number): Promise<PokeAPIPokemonForm> {
  return fetchWithCache(`${BASE_URL}/pokemon-form/${nameOrId}`);
}

// Fetch all Pokemon varieties (regional forms, etc.)
export async function fetchPokemonVarieties(species: PokeAPISpecies): Promise<PokeAPIPokemon[]> {
  if (!species.varieties || species.varieties.length <= 1) {
    return [];
  }
  
  // Récupérer toutes les variétés sauf celle par défaut
  const varieties = species.varieties.filter(v => !v.is_default);
  
  const promises = varieties.map(async (variety) => {
    const pokemonId = variety.pokemon.url.split('/').slice(-2, -1)[0];
    return fetchPokemonDetails(pokemonId);
  });
  
  return Promise.all(promises);
}

// Extract evolution chain ID from URL
export function getEvolutionChainId(url: string): number {
  const parts = url.split('/');
  return parseInt(parts[parts.length - 2]);
}

// Clear cache (useful for testing or forcing fresh data)
export function clearCache(): void {
  cache.clear();
}
