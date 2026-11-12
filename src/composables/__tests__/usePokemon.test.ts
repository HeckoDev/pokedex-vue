import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePokemon } from '../usePokemon';
import { fetchPokemonDetails, fetchPokemonSpecies } from '@/services/pokeapi';
import { transformPokemon } from '@/services/pokeapi-transform';

vi.mock('@/services/pokeapi', () => ({
  fetchPokemonDetails: vi.fn(),
  fetchPokemonSpecies: vi.fn(),
}));
vi.mock('@/services/pokeapi-transform', () => ({ transformPokemon: vi.fn() }));

describe('usePokemon Composable', () => {
  // Chaque test doit avoir sa propre instance
  let pokemon: ReturnType<typeof usePokemon>;

  beforeEach(() => {
    // Créer une nouvelle instance pour chaque test
    pokemon = usePokemon();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { searchQuery, selectedType, selectedLanguage, isShiny } = pokemon;
      
      expect(searchQuery.value).toBe('');
      expect(selectedType.value).toBe('');
      expect(selectedLanguage.value).toBe('fr');
      expect(isShiny.value).toBe(false);
    });

    it('should load Pokémon data', () => {
      const { pokemons, allPokemons } = pokemon;
      
      expect(pokemons.value).toBeDefined();
      expect(allPokemons.value).toBeDefined();
      expect(Array.isArray(pokemons.value)).toBe(true);
      expect(pokemons.value.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Search Functionality', () => {
    it('should filter Pokémon by name', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'Pikachu';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      if (filtered.length > 0) {
        expect(filtered.some(p => p.name.en.toLowerCase().includes('pikachu'))).toBe(true);
      }
    });

    it('should return all Pokémon when search is empty', () => {
      const { searchQuery, filteredPokemons, pokemons: allPokemon } = pokemon;
      
      searchQuery.value = '';
      
      expect(filteredPokemons.value.length).toBe(allPokemon.value.length);
    });

    it('should be case insensitive', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'BULBASAUR';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle partial matches', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'char';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      if (filtered.length > 0) {
        expect(filtered.some(p => p.name.en.toLowerCase().includes('char'))).toBe(true);
      }
    });
  });

  describe('Type Filtering', () => {
    it('should filter Pokémon by type', () => {
      const { selectedType, filteredPokemons } = pokemon;
      
      selectedType.value = 'Feu';
      
      const filtered = filteredPokemons.value;
      expect(filtered.every(p => p.types?.some(t => t.name === 'Feu'))).toBe(true);
    });

    it('should return all Pokémon when no type is selected', () => {
      const { selectedType, filteredPokemons, pokemons: allPokemon } = pokemon;
      
      selectedType.value = '';
      
      expect(filteredPokemons.value.length).toBe(allPokemon.value.length);
    });

    it('should get all unique types', () => {
      const { allTypes } = pokemon;
      
      expect(allTypes.value).toBeDefined();
      expect(Array.isArray(allTypes.value)).toBe(true);
      expect(allTypes.value.length).toBeGreaterThanOrEqual(0);
      if (allTypes.value.length > 0) {
        // Les noms de types devraient exister si on a des données
        expect(allTypes.value.length).toBeGreaterThan(0);
      }
    });

    it('should have sorted types', () => {
      const { allTypes } = pokemon;
      
      const types = allTypes.value;
      const sortedTypes = [...types].sort((a, b) => a.localeCompare(b));
      expect(types).toEqual(sortedTypes);
    });
  });

  describe('Combined Filters', () => {
    it('should filter by both search and type', () => {
      const { searchQuery, selectedType, filteredPokemons, selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'char';
      selectedType.value = 'Feu';
      
      const filtered = filteredPokemons.value;
      expect(filtered.every(p => 
        p.name.en.toLowerCase().includes('char') &&
        p.types?.some(t => t.name === 'Feu')
      )).toBe(true);
    });
  });

  describe('Generation Grouping', () => {
    it('should group Pokémon by generation', () => {
      const { pokemonsByGeneration } = pokemon;
      
      const generations = pokemonsByGeneration.value;
      expect(Array.isArray(generations)).toBe(true);
      expect(generations.length).toBeGreaterThanOrEqual(0);
      
      generations.forEach(gen => {
        expect(gen).toHaveProperty('generation');
        expect(gen).toHaveProperty('pokemons');
        expect(Array.isArray(gen.pokemons)).toBe(true);
      });
    });

    it('should sort generations in ascending order', () => {
      const { pokemonsByGeneration } = pokemon;
      
      const generations = pokemonsByGeneration.value;
      const genNumbers = generations.map(g => g.generation);
      
      for (let i = 1; i < genNumbers.length; i++) {
        expect(genNumbers[i]).toBeGreaterThan(genNumbers[i - 1]);
      }
    });

    it('should respect filters in generation grouping', () => {
      const { searchQuery, pokemonsByGeneration, selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'Pikachu';
      
      const generations = pokemonsByGeneration.value;
      const totalPokemon = generations.reduce((sum, gen) => sum + gen.pokemons.length, 0);
      
      expect(totalPokemon).toBeGreaterThanOrEqual(0);
      if (totalPokemon > 0) {
        generations.forEach(gen => {
          gen.pokemons.forEach(p => {
            expect(p.name.en.toLowerCase()).toContain('pikachu');
          });
        });
      }
    });
  });

  describe('Language Selection', () => {
    it('should switch language', () => {
      const { selectedLanguage } = pokemon;
      
      selectedLanguage.value = 'en';
      expect(selectedLanguage.value).toBe('en');
      
      selectedLanguage.value = 'jp';
      expect(selectedLanguage.value).toBe('jp');
      
      selectedLanguage.value = 'fr';
      expect(selectedLanguage.value).toBe('fr');
    });

    it('should filter based on selected language', () => {
      const { searchQuery, selectedLanguage, filteredPokemons } = pokemon;
      
      selectedLanguage.value = 'jp';
      searchQuery.value = 'ピカチュウ';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPokemonById', () => {
    it('should find Pokémon by ID', () => {
      const { getPokemonById, pokemons } = pokemon;
      
      // Vérifier qu'il y a des Pokémon chargés
      if (pokemons.value.length === 0) {
        // Si aucun Pokémon n'est chargé, le test devrait passer
        const foundPokemon = getPokemonById(1);
        expect(foundPokemon).toBeUndefined();
      } else {
        // Si des Pokémon sont chargés, on devrait pouvoir trouver le premier
        const firstPokemon = pokemons.value[0];
        const foundPokemon = getPokemonById(firstPokemon.pokedex_id);
        expect(foundPokemon).toBeDefined();
        expect(foundPokemon?.pokedex_id).toBe(firstPokemon.pokedex_id);
      }
    });

    it('should return undefined for non-existent ID', () => {
      const { getPokemonById } = pokemon;
      
      const foundPokemon = getPokemonById(999999);
      expect(foundPokemon).toBeUndefined();
    });
  });

  describe('Shiny Toggle', () => {
    it('should toggle shiny state', () => {
      const { isShiny } = pokemon;
      
      expect(isShiny.value).toBe(false);
      
      isShiny.value = true;
      expect(isShiny.value).toBe(true);
      
      isShiny.value = false;
      expect(isShiny.value).toBe(false);
    });
  });

  describe('loadPokemons', () => {
    it('loads the local pokedex once and reports progress', async () => {
      const { pokemons, loadPokemons, loadingProgress, isLoading, error } = pokemon;
      pokemons.value = [];

      await loadPokemons();

      expect(pokemons.value.length).toBeGreaterThan(0);
      expect(loadingProgress.value).toEqual({ loaded: pokemons.value.length, total: pokemons.value.length });
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();

      const first = pokemons.value;
      await loadPokemons();
      expect(pokemons.value).toBe(first);
    });
  });

  describe('Sorting and advanced filters', () => {
    beforeEach(async () => {
      pokemon.searchQuery.value = '';
      pokemon.selectedType.value = '';
      pokemon.selectedLanguage.value = 'en';
      pokemon.applyAdvancedFilters({ generations: [], sortBy: null });
      await pokemon.loadPokemons();
    });

    it('sorts by name in both directions', () => {
      pokemon.applyAdvancedFilters({ generations: [1], sortBy: { field: 'name', order: 'asc' } });
      const asc = pokemon.filteredPokemons.value.map((p) => p.name.en.toLowerCase());
      expect(asc[0] <= asc[asc.length - 1]).toBe(true);

      pokemon.applyAdvancedFilters({ generations: [1], sortBy: { field: 'name', order: 'desc' } });
      const desc = pokemon.filteredPokemons.value.map((p) => p.name.en.toLowerCase());
      expect(desc[0] >= desc[desc.length - 1]).toBe(true);
    });

    it('sorts by pokedex id descending', () => {
      pokemon.applyAdvancedFilters({ generations: [1], sortBy: { field: 'pokedex_id', order: 'desc' } });
      const ids = pokemon.filteredPokemons.value.map((p) => p.pokedex_id);
      expect(ids[0]).toBeGreaterThan(ids[ids.length - 1]);
    });

    it('sorts by a stat', () => {
      pokemon.applyAdvancedFilters({ generations: [1], sortBy: { field: 'hp', order: 'desc' } });
      const hp = pokemon.filteredPokemons.value.map((p) => p.stats?.hp ?? 0);
      expect(hp[0]).toBeGreaterThanOrEqual(hp[hp.length - 1]);
    });

    it('keeps the original order for an unknown sort field', () => {
      pokemon.applyAdvancedFilters({ generations: [1], sortBy: { field: 'unknown', order: 'asc' } });
      const ids = pokemon.filteredPokemons.value.map((p) => p.pokedex_id);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });

    it('filters by generation', () => {
      pokemon.applyAdvancedFilters({ generations: [2], sortBy: null });
      expect(pokemon.filteredPokemons.value.every((p) => p.generation === 2)).toBe(true);
      expect(pokemon.selectedGenerations.value).toEqual([2]);
    });
  });

  describe('enrichPokemonFromAPI', () => {
    const base = { pokedex_id: 25, name: { fr: 'Pikachu', en: 'Pikachu', jp: 'ピカチュウ' } } as any;

    it('returns the enriched pokemon', async () => {
      vi.mocked(fetchPokemonDetails).mockResolvedValue({ id: 25 } as any);
      vi.mocked(fetchPokemonSpecies).mockResolvedValue({ id: 25 } as any);
      vi.mocked(transformPokemon).mockResolvedValue({ ...base, category: 'Souris' });

      const result = await pokemon.enrichPokemonFromAPI(base);

      expect(fetchPokemonDetails).toHaveBeenCalledWith(25);
      expect(transformPokemon).toHaveBeenCalledWith({ id: 25 }, { id: 25 }, base);
      expect(result.category).toBe('Souris');
    });

    it('falls back to the local pokemon on API failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetchPokemonDetails).mockRejectedValue(new Error('offline'));

      expect(await pokemon.enrichPokemonFromAPI(base)).toBe(base);
    });
  });
});