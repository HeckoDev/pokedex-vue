import { describe, it, expect } from 'vitest';
import pokedex from '@/data/pokedex.json';
import type { Pokemon } from '@/types/pokemon';
import { computeDefense, groupByMultiplier, searchPokemonByName } from '../typeChart';

const pokemons = pokedex as unknown as Pokemon[];

describe('computeDefense', () => {
  it('matches the resistances shipped with every Pokémon of the Pokédex', () => {
    const mismatches = pokemons
      .filter((p) => p.types?.length && p.resistances?.length)
      .filter((p) => {
        const defense = computeDefense(p.types!.map((t) => t.name));
        // The data also bakes in ability immunities (Lévitation, Absorb Eau…) as x0: this chart is type-only
        return p.resistances!.some(
          (r) => r.multiplier !== 0 && defense[r.name as keyof typeof defense] !== r.multiplier
        );
      })
      .map((p) => p.name.fr);
    // The source data has a handful of inconsistent entries (e.g. Zarude's types); tolerate < 1 %
    expect(mismatches.length).toBeLessThan(pokemons.length / 100);
  });

  it('stacks weaknesses on dual types and handles immunities', () => {
    const charizard = computeDefense(['Feu', 'Vol']);
    expect(charizard.Roche).toBe(4);
    expect(charizard.Sol).toBe(0);
    expect(charizard.Plante).toBe(0.25);
  });
});

describe('groupByMultiplier', () => {
  it('orders groups from x4 to x0 and omits empty ones', () => {
    const groups = groupByMultiplier(computeDefense(['Feu', 'Vol']));
    expect(groups.map((g) => g.multiplier)).toEqual([4, 2, 1, 0.5, 0.25, 0]);
    expect(groupByMultiplier(computeDefense(['Normal'])).map((g) => g.multiplier)).toEqual([2, 1, 0]);
  });
});

describe('searchPokemonByName', () => {
  it('finds Pokémon in any language, ignoring accents and case', () => {
    expect(searchPokemonByName(pokemons, 'dracaufeu')[0].name.en).toBe('Charizard');
    expect(searchPokemonByName(pokemons, 'CHARIZ')[0].pokedex_id).toBe(6);
    expect(searchPokemonByName(pokemons, 'リザードン')[0].pokedex_id).toBe(6);
  });

  it('returns nothing for an empty query and respects the limit', () => {
    expect(searchPokemonByName(pokemons, '  ')).toEqual([]);
    expect(searchPokemonByName(pokemons, 'a', 3)).toHaveLength(3);
  });
});
