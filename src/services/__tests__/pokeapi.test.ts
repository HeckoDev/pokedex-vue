import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchPokemonList,
  fetchPokemonDetails,
  fetchPokemonSpecies,
  fetchEvolutionChain,
  fetchPokemonFormMetadata,
  getGenerationNumber,
  getEvolutionChainId,
  clearCache,
  type PokeAPIListResponse,
  type PokeAPIPokemon,
  type PokeAPISpecies,
} from '../pokeapi';

// Mock fetch
global.fetch = vi.fn();

describe('PokeAPI Service', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  describe('fetchPokemonList', () => {
    it('should fetch list of Pokemon', async () => {
      const mockResponse: PokeAPIListResponse = {
        count: 1025,
        next: null,
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPokemonList();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0'
      );
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse: PokeAPIListResponse = {
        count: 1025,
        next: null,
        previous: null,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchPokemonList();
      await fetchPokemonList();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle custom limit and offset', async () => {
      const mockResponse: PokeAPIListResponse = {
        count: 1025,
        next: null,
        previous: null,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchPokemonList(20, 10);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon?limit=20&offset=10'
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchPokemonList()).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('fetchPokemonDetails', () => {
    it('should fetch Pokemon details by ID', async () => {
      const mockPokemon: Partial<PokeAPIPokemon> = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPokemon,
      });

      const result = await fetchPokemonDetails(25);

      expect(result).toEqual(mockPokemon);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon/25'
      );
    });

    it('should fetch Pokemon details by name', async () => {
      const mockPokemon: Partial<PokeAPIPokemon> = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPokemon,
      });

      const result = await fetchPokemonDetails('pikachu');

      expect(result).toEqual(mockPokemon);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon/pikachu'
      );
    });

    it('should use cache for repeated requests', async () => {
      const mockPokemon: Partial<PokeAPIPokemon> = {
        id: 25,
        name: 'pikachu',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPokemon,
      });

      await fetchPokemonDetails(25);
      await fetchPokemonDetails(25);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchPokemonSpecies', () => {
    it('should fetch Pokemon species data', async () => {
      const mockSpecies: Partial<PokeAPISpecies> = {
        id: 25,
        name: 'pikachu',
        generation: {
          name: 'generation-i',
          url: 'https://pokeapi.co/api/v2/generation/1/',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpecies,
      });

      const result = await fetchPokemonSpecies(25);

      expect(result).toEqual(mockSpecies);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon-species/25'
      );
    });
  });

  describe('fetchEvolutionChain', () => {
    it('should fetch evolution chain data', async () => {
      const mockChain = {
        id: 1,
        chain: {
          species: {
            name: 'bulbasaur',
            url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
          },
          evolution_details: [],
          evolves_to: [],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChain,
      });

      const result = await fetchEvolutionChain(1);

      expect(result).toEqual(mockChain);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/evolution-chain/1'
      );
    });
  });

  describe('fetchPokemonFormMetadata', () => {
    it('should fetch Pokemon form metadata', async () => {
      const mockForm = {
        id: 1,
        name: 'bulbasaur',
        form_name: 'bulbasaur',
        is_default: true,
        is_mega: false,
        is_battle_only: false,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockForm,
      });

      const result = await fetchPokemonFormMetadata(1);

      expect(result).toEqual(mockForm);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://pokeapi.co/api/v2/pokemon-form/1'
      );
    });
  });

  describe('getGenerationNumber', () => {
    it('should extract generation number from generation name', () => {
      expect(getGenerationNumber('generation-1')).toBe(1);
      expect(getGenerationNumber('generation-2')).toBe(2);
      expect(getGenerationNumber('generation-3')).toBe(3);
      expect(getGenerationNumber('generation-4')).toBe(4);
      expect(getGenerationNumber('generation-5')).toBe(5);
    });

    it('should return 1 for invalid generation name', () => {
      expect(getGenerationNumber('invalid')).toBe(1);
      expect(getGenerationNumber('')).toBe(1);
    });
  });

  describe('getEvolutionChainId', () => {
    it('should extract evolution chain ID from URL', () => {
      const url = 'https://pokeapi.co/api/v2/evolution-chain/1/';
      expect(getEvolutionChainId(url)).toBe(1);
    });

    it('should handle different URL formats', () => {
      const url1 = 'https://pokeapi.co/api/v2/evolution-chain/42/';
      const url2 = 'https://pokeapi.co/api/v2/evolution-chain/123/';
      
      expect(getEvolutionChainId(url1)).toBe(42);
      expect(getEvolutionChainId(url2)).toBe(123);
    });
  });

  describe('clearCache', () => {
    it('should clear cache', async () => {
      const mockPokemon: Partial<PokeAPIPokemon> = {
        id: 25,
        name: 'pikachu',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPokemon,
      });

      // Premier appel
      await fetchPokemonDetails(25);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Deuxième appel (doit utiliser le cache)
      await fetchPokemonDetails(25);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Effacer le cache
      clearCache();

      // Troisième appel (doit refaire le fetch)
      await fetchPokemonDetails(25);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
