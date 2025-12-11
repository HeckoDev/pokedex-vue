import { describe, it, expect, beforeEach } from 'vitest';
import { usePokemon } from '../usePokemon';

describe('usePokemon Composable', () => {
  beforeEach(() => {
    // Reset state between tests if needed
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { searchQuery, selectedType, selectedLanguage, isShiny } = usePokemon();
      
      expect(searchQuery.value).toBe('');
      expect(selectedType.value).toBe('');
      expect(selectedLanguage.value).toBe('fr');
      expect(isShiny.value).toBe(false);
    });

    it('should load Pokémon data', () => {
      const { pokemons, allPokemons } = usePokemon();
      
      expect(pokemons.value).toBeDefined();
      expect(allPokemons.value).toBeDefined();
      expect(Array.isArray(pokemons.value)).toBe(true);
      expect(pokemons.value.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    it('should filter Pokémon by name', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = usePokemon();
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'Pikachu';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(p => p.name.en.toLowerCase().includes('pikachu'))).toBe(true);
    });

    it('should return all Pokémon when search is empty', () => {
      const { searchQuery, filteredPokemons, pokemons } = usePokemon();
      
      searchQuery.value = '';
      
      expect(filteredPokemons.value.length).toBe(pokemons.value.length);
    });

    it('should be case insensitive', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = usePokemon();
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'BULBASAUR';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle partial matches', () => {
      const { searchQuery, filteredPokemons, selectedLanguage } = usePokemon();
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'char';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(p => p.name.en.toLowerCase().includes('char'))).toBe(true);
    });
  });

  describe('Type Filtering', () => {
    it('should filter Pokémon by type', () => {
      const { selectedType, filteredPokemons } = usePokemon();
      
      selectedType.value = 'Feu';
      
      const filtered = filteredPokemons.value;
      expect(filtered.every(p => p.types?.some(t => t.name === 'Feu'))).toBe(true);
    });

    it('should return all Pokémon when no type is selected', () => {
      const { selectedType, filteredPokemons, pokemons } = usePokemon();
      
      selectedType.value = '';
      
      expect(filteredPokemons.value.length).toBe(pokemons.value.length);
    });

    it('should get all unique types', () => {
      const { allTypes } = usePokemon();
      
      expect(allTypes.value).toBeDefined();
      expect(Array.isArray(allTypes.value)).toBe(true);
      expect(allTypes.value.length).toBeGreaterThan(0);
      expect(allTypes.value).toContain('Feu');
      expect(allTypes.value).toContain('Eau');
      expect(allTypes.value).toContain('Plante');
    });

    it('should have sorted types', () => {
      const { allTypes } = usePokemon();
      
      const types = allTypes.value;
      const sortedTypes = [...types].sort();
      expect(types).toEqual(sortedTypes);
    });
  });

  describe('Combined Filters', () => {
    it('should filter by both search and type', () => {
      const { searchQuery, selectedType, filteredPokemons, selectedLanguage } = usePokemon();
      
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
      const { pokemonsByGeneration } = usePokemon();
      
      const generations = pokemonsByGeneration.value;
      expect(Array.isArray(generations)).toBe(true);
      expect(generations.length).toBeGreaterThan(0);
      
      generations.forEach(gen => {
        expect(gen).toHaveProperty('generation');
        expect(gen).toHaveProperty('pokemons');
        expect(Array.isArray(gen.pokemons)).toBe(true);
      });
    });

    it('should sort generations in ascending order', () => {
      const { pokemonsByGeneration } = usePokemon();
      
      const generations = pokemonsByGeneration.value;
      const genNumbers = generations.map(g => g.generation);
      
      for (let i = 1; i < genNumbers.length; i++) {
        expect(genNumbers[i]).toBeGreaterThan(genNumbers[i - 1]);
      }
    });

    it('should respect filters in generation grouping', () => {
      const { searchQuery, pokemonsByGeneration, selectedLanguage } = usePokemon();
      
      selectedLanguage.value = 'en';
      searchQuery.value = 'Pikachu';
      
      const generations = pokemonsByGeneration.value;
      const totalPokemon = generations.reduce((sum, gen) => sum + gen.pokemons.length, 0);
      
      expect(totalPokemon).toBeGreaterThan(0);
      generations.forEach(gen => {
        gen.pokemons.forEach(p => {
          expect(p.name.en.toLowerCase()).toContain('pikachu');
        });
      });
    });
  });

  describe('Language Selection', () => {
    it('should switch language', () => {
      const { selectedLanguage } = usePokemon();
      
      selectedLanguage.value = 'en';
      expect(selectedLanguage.value).toBe('en');
      
      selectedLanguage.value = 'jp';
      expect(selectedLanguage.value).toBe('jp');
      
      selectedLanguage.value = 'fr';
      expect(selectedLanguage.value).toBe('fr');
    });

    it('should filter based on selected language', () => {
      const { searchQuery, selectedLanguage, filteredPokemons } = usePokemon();
      
      selectedLanguage.value = 'jp';
      searchQuery.value = 'ピカチュウ';
      
      const filtered = filteredPokemons.value;
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('getPokemonById', () => {
    it('should find Pokémon by ID', () => {
      const { getPokemonById } = usePokemon();
      
      const pokemon = getPokemonById(1);
      expect(pokemon).toBeDefined();
      expect(pokemon?.pokedex_id).toBe(1);
    });

    it('should return undefined for non-existent ID', () => {
      const { getPokemonById } = usePokemon();
      
      const pokemon = getPokemonById(999999);
      expect(pokemon).toBeUndefined();
    });
  });

  describe('Shiny Toggle', () => {
    it('should toggle shiny state', () => {
      const { isShiny } = usePokemon();
      
      expect(isShiny.value).toBe(false);
      
      isShiny.value = true;
      expect(isShiny.value).toBe(true);
      
      isShiny.value = false;
      expect(isShiny.value).toBe(false);
    });
  });
});
