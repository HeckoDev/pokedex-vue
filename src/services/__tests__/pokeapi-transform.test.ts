import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Pokemon } from '@/types/pokemon';

vi.mock('../pokeapi', () => ({
  getGenerationNumber: (name: string) => parseInt(name.replace('generation-', ''), 10) || 1,
  getEvolutionChainId: (url: string) => parseInt(url.split('/').slice(-2)[0], 10),
  fetchEvolutionChain: vi.fn(),
  fetchPokemonVarieties: vi.fn(),
  fetchPokemonDetails: vi.fn(),
  fetchAbility: vi.fn(),
}));

import * as api from '../pokeapi';
import {
  transformPokemon,
  transformPokemonList,
  loadMegaEvolutionData,
  loadGigamaxData,
  loadRegionalForm,
} from '../pokeapi-transform';

const mocked = vi.mocked(api);

const art = (id: string) => ({ front_default: `${id}.png`, front_shiny: `${id}-s.png` });

function apiPokemon(name: string, id = 6, over: Record<string, unknown> = {}): any {
  return {
    id,
    name,
    height: 17,
    weight: 905,
    types: [{ slot: 1, type: { name: 'fire', url: '' } }, { slot: 2, type: { name: 'unknown-type', url: '' } }],
    sprites: { front_default: null, front_shiny: null, other: { 'official-artwork': art(name), home: art(`${name}-home`) } },
    stats: [
      { base_stat: 78, stat: { name: 'hp', url: '' } },
      { base_stat: 84, stat: { name: 'attack', url: '' } },
      { base_stat: 78, stat: { name: 'defense', url: '' } },
      { base_stat: 109, stat: { name: 'special-attack', url: '' } },
      { base_stat: 85, stat: { name: 'special-defense', url: '' } },
      { base_stat: 100, stat: { name: 'speed', url: '' } },
    ],
    abilities: [
      { is_hidden: false, ability: { name: 'blaze', url: '' } },
      { is_hidden: true, ability: { name: 'solar-power', url: '' } },
    ],
    ...over,
  };
}

function species(over: Record<string, unknown> = {}): any {
  return {
    id: 6,
    name: 'charizard',
    generation: { name: 'generation-1', url: '' },
    names: [
      { language: { name: 'fr' }, name: 'Dracaufeu' },
      { language: { name: 'en' }, name: 'Charizard' },
      { language: { name: 'ja' }, name: 'リザードン' },
    ],
    genera: [{ language: { name: 'fr' }, genus: 'Flamme Pokémon' }],
    flavor_text_entries: [],
    evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/2/' },
    varieties: [{ is_default: true, pokemon: { name: 'charizard', url: '' } }],
    ...over,
  };
}

const variety = (name: string, id = 10034) => ({
  is_default: false,
  pokemon: { name, url: `https://pokeapi.co/api/v2/pokemon/${id}/` },
});

const details = (over: Record<string, unknown> = {}) => ({
  min_level: null,
  item: null,
  trigger: { name: 'level-up', url: '' },
  held_item: null,
  time_of_day: '',
  location: null,
  known_move: null,
  min_happiness: null,
  min_beauty: null,
  min_affection: null,
  ...over,
});

const link = (id: number, name: string, evolves_to: any[] = [], evolution_details: any[] = []) => ({
  species: { name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
  evolution_details,
  evolves_to,
});

const base = (over: Partial<Pokemon> = {}): Pokemon =>
  ({
    pokedex_id: 6,
    species_name: 'charizard',
    name: { fr: 'Dracaufeu', en: 'Charizard', jp: 'リザードン' },
    sprites: { regular: 'base.png', shiny: null, gmax: null },
    types: [],
    stats: {},
    talents: null,
    evolution: null,
    ...over,
  }) as unknown as Pokemon;

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocked.fetchEvolutionChain.mockResolvedValue({ id: 2, chain: link(4, 'charmander') } as any);
  mocked.fetchPokemonVarieties.mockResolvedValue([]);
  mocked.fetchAbility.mockResolvedValue({
    id: 1,
    name: 'blaze',
    names: [
      { language: { name: 'fr' }, name: 'Brasier' },
      { language: { name: 'en' }, name: 'Blaze' },
      { language: { name: 'ja' }, name: 'もうか' },
    ],
  });
});

describe('transformPokemon', () => {
  it('maps base data (names, types, stats, sprites, size)', async () => {
    const result = await transformPokemon(apiPokemon('charizard'), species());

    expect(result.name).toEqual({ fr: 'Dracaufeu', en: 'Charizard', jp: 'リザードン' });
    expect(result.category).toBe('Flamme');
    expect(result.generation).toBe(1);
    expect(result.types[0]).toEqual({ name: 'Feu', image: '/types/feu.png' });
    expect(result.types[1]).toEqual({ name: 'unknown-type', image: '' });
    expect(result.stats).toEqual({ hp: 78, atk: 84, def: 78, spe_atk: 109, spe_def: 85, vit: 100 });
    expect(result.sprites.regular).toBe('charizard.png');
    expect(result.sprites.shiny).toBe('charizard-s.png');
    expect(result.height).toBe('1.7 m');
    expect(result.weight).toBe('90.5 kg');
    expect(result.species_name).toBe('charizard');
  });

  it('falls back to species name / empty values when localized data is missing', async () => {
    const result = await transformPokemon(
      apiPokemon('x', 1, { stats: [], sprites: { front_default: 'fd.png', front_shiny: null, other: { 'official-artwork': { front_default: null, front_shiny: null }, home: { front_default: null, front_shiny: null } } } }),
      species({ names: [], genera: [] }),
    );

    expect(result.name).toEqual({ fr: 'charizard', en: 'charizard', jp: 'charizard' });
    expect(result.category).toBe('');
    expect(result.stats.hp).toBe(0);
    expect(result.sprites.regular).toBe('fd.png');
  });

  it('localizes abilities and falls back to English for missing languages', async () => {
    mocked.fetchAbility.mockResolvedValueOnce({ id: 1, name: 'blaze', names: [{ language: { name: 'en' }, name: 'Blaze' }] });
    mocked.fetchAbility.mockResolvedValueOnce({ id: 2, name: 'solar-power', names: [] });

    const { talents } = await transformPokemon(apiPokemon('charizard'), species());

    expect(talents![0]).toEqual({ name: 'Blaze', tc: false, names: { fr: 'Blaze', en: 'Blaze', jp: 'Blaze' } });
    expect(talents![1].names).toEqual({ fr: 'solar power', en: 'solar power', jp: 'solar power' });
    expect(talents![1].tc).toBe(true);
  });

  it('uses fr/en/ja ability names when available', async () => {
    const { talents } = await transformPokemon(apiPokemon('charizard'), species());
    expect(talents![0].names).toEqual({ fr: 'Brasier', en: 'Blaze', jp: 'もうか' });
  });

  it('keeps existing talents when the ability request fails', async () => {
    mocked.fetchAbility.mockRejectedValue(new Error('boom'));
    const fallback = [{ name: 'Brasier', tc: false }] as any;

    const { talents } = await transformPokemon(apiPokemon('charizard'), species(), base({ talents: fallback }));

    expect(talents).toBe(fallback);
  });

  it('returns the fallback when the pokemon has no ability', async () => {
    const { talents } = await transformPokemon(apiPokemon('x', 1, { abilities: [] }), species());
    expect(talents).toBeNull();
  });

  it('transformPokemonList transforms every entry', async () => {
    const list = await transformPokemonList([
      { pokemon: apiPokemon('a', 1), species: species({ name: 'a' }) },
      { pokemon: apiPokemon('b', 2), species: species({ name: 'b' }) },
    ]);
    expect(list.map(p => p.pokedex_id)).toEqual([1, 2]);
  });
});

describe('evolutions', () => {
  it('extracts pre and next evolutions with translatable conditions', async () => {
    mocked.fetchEvolutionChain.mockResolvedValue({
      id: 2,
      chain: link(4, 'charmander', [
        link(5, 'charmeleon', [link(6, 'charizard', [], [details({ min_level: 36 })])], [details({ min_level: 16 })]),
      ]),
    } as any);

    const mid = await transformPokemon(apiPokemon('charmeleon', 5), species());
    expect(mid.evolution!.pre).toEqual([{ pokedex_id: 4, name: 'charmander', condition: '' }]);
    expect(mid.evolution!.next![0]).toMatchObject({
      pokedex_id: 6,
      condition: 'Niveau 36',
      conditionKey: 'evolutionCondition.level',
      conditionVars: { level: '36' },
    });

    const first = await transformPokemon(apiPokemon('charmander', 4), species());
    expect(first.evolution!.pre).toBeNull();
    expect(first.evolution!.next![0].condition).toBe('Niveau 16');
  });

  it.each([
    [[], { condition: '' }],
    [[details({ item: { name: 'fire-stone', url: '' } })], { condition: 'Utiliser fire stone', conditionKey: 'evolutionCondition.useItem', itemSlug: 'fire-stone' }],
    [[details({ trigger: { name: 'trade', url: '' } })], { condition: 'Échange', conditionKey: 'evolutionCondition.trade' }],
    [[details({ min_happiness: 220 })], { condition: 'Bonheur 220+', conditionKey: 'evolutionCondition.happiness' }],
    [[details({ known_move: { name: 'mimic', url: '' } })], { condition: 'Apprendre mimic', conditionKey: 'evolutionCondition.learnMove' }],
    [[details({ location: { name: 'x', url: '' } })], { condition: 'Condition spéciale', conditionKey: 'evolutionCondition.special' }],
  ])('maps evolution condition %#', async (evolution_details, expected) => {
    mocked.fetchEvolutionChain.mockResolvedValue({
      id: 2,
      chain: link(4, 'a', [link(5, 'b', [], evolution_details as any)]),
    } as any);

    const result = await transformPokemon(apiPokemon('a', 4), species());
    expect(result.evolution!.next![0]).toMatchObject(expected);
  });

  it('returns null evolution when the chain is a single stage without megas', async () => {
    mocked.fetchEvolutionChain.mockResolvedValue({ id: 2, chain: link(6, 'charizard') } as any);
    const result = await transformPokemon(apiPokemon('charizard'), species());
    expect(result.evolution).toBeNull();
  });

  it('returns null evolution when the chain request fails', async () => {
    mocked.fetchEvolutionChain.mockRejectedValue(new Error('down'));
    const result = await transformPokemon(apiPokemon('charizard'), species());
    expect(result.evolution).toBeNull();
  });
});

describe('mega and gigamax forms', () => {
  const withVarieties = (...names: string[]) =>
    species({ varieties: [{ is_default: true, pokemon: { name: 'charizard', url: '' } }, ...names.map(n => variety(n))] });

  it('builds mega evolutions (X / Y / plain) and the gmax sprite set', async () => {
    mocked.fetchPokemonDetails.mockImplementation(async (name) => apiPokemon(String(name)));

    const result = await transformPokemon(
      apiPokemon('charizard'),
      withVarieties('charizard-mega-x', 'charizard-mega-y', 'charizard-mega', 'charizard-gmax', 'charizard-cosplay'),
    );

    expect(result.evolution!.mega!.map(m => [m.orbe, m.variety])).toEqual([
      ['Dracaufeuite X', 'charizard-mega-x'],
      ['Dracaufeuite Y', 'charizard-mega-y'],
      ['Dracaufeuite', 'charizard-mega'],
    ]);
    expect(result.sprites.gmax).toMatchObject({ regular: 'charizard-gmax.png', variety: 'charizard-gmax' });
    expect(mocked.fetchPokemonDetails).not.toHaveBeenCalledWith('charizard-cosplay');
  });

  it('skips a variety whose request fails', async () => {
    mocked.fetchPokemonDetails.mockImplementation(async (name) => {
      if (name === 'charizard-mega-x') throw new Error('404');
      return apiPokemon(String(name));
    });

    const result = await transformPokemon(apiPokemon('charizard'), withVarieties('charizard-mega-x', 'charizard-mega-y'));

    expect(result.evolution!.mega!.map(m => m.variety)).toEqual(['charizard-mega-y']);
  });

  it('has no mega/gmax when species only has the default variety', async () => {
    const result = await transformPokemon(apiPokemon('charizard'), species({ varieties: undefined }));
    expect(result.sprites.gmax).toBeNull();
    expect(result.evolution).toBeNull();
  });
});

describe('regional forms', () => {
  it('detects regions from variety names', async () => {
    mocked.fetchPokemonVarieties.mockResolvedValue([
      { name: 'meowth-alola' }, { name: 'meowth-galar' }, { name: 'x-hisui' }, { name: 'y-paldea' }, { name: 'z-other' },
    ] as any);

    const result = await transformPokemon(apiPokemon('meowth', 52), species());

    expect(result.formes!.map(f => f.region)).toEqual(['alola', 'galar', 'hisui', 'paldea']);
  });

  it('returns null formes when none match or request fails', async () => {
    mocked.fetchPokemonVarieties.mockResolvedValue([{ name: 'z-other' }] as any);
    expect((await transformPokemon(apiPokemon('a'), species())).formes).toBeNull();

    mocked.fetchPokemonVarieties.mockRejectedValue(new Error('x'));
    expect((await transformPokemon(apiPokemon('a'), species())).formes).toBeNull();
  });
});

describe('loadMegaEvolutionData', () => {
  it('loads the exact variety and reuses precomputed mega sprites', async () => {
    mocked.fetchPokemonDetails.mockResolvedValue(apiPokemon('charizard-mega-y', 10035, { height: 17, weight: 1005 }));
    const pokemon = base({
      evolution: { pre: null, next: null, mega: [{ orbe: 'x', variety: 'charizard-mega-y', sprites: { regular: 'pre.png', shiny: 'pre-s.png' } }] } as any,
    });

    const result = await loadMegaEvolutionData(pokemon, 'Y', 'charizard-mega-y');

    expect(mocked.fetchPokemonDetails).toHaveBeenCalledWith('charizard-mega-y');
    expect(result.sprites).toEqual({ regular: 'pre.png', shiny: 'pre-s.png', gmax: null });
    expect(result.weight).toBe('100.5 kg');
    expect(result.types[0].name).toBe('Feu');
  });

  it.each([
    ['X', 'charizard-mega-x'],
    ['', 'charizard-mega'],
  ])('derives the variety name from the variant %j', async (variant, expected) => {
    mocked.fetchPokemonDetails.mockResolvedValue(apiPokemon(expected));
    const result = await loadMegaEvolutionData(base(), variant);
    expect(mocked.fetchPokemonDetails).toHaveBeenCalledWith(expected);
    expect(result.sprites.regular).toBe(`${expected}.png`);
  });

  it('falls back to the english name when species_name is absent', async () => {
    mocked.fetchPokemonDetails.mockResolvedValue(apiPokemon('x'));
    await loadMegaEvolutionData(base({ species_name: undefined }), 'Z');
    expect(mocked.fetchPokemonDetails).toHaveBeenCalledWith('charizard-mega-z');
  });

  it('returns the base pokemon on error', async () => {
    mocked.fetchPokemonDetails.mockRejectedValue(new Error('x'));
    const pokemon = base();
    expect(await loadMegaEvolutionData(pokemon, 'X')).toBe(pokemon);
  });
});

describe('loadGigamaxData', () => {
  it('uses the stored gmax sprites and variety', async () => {
    mocked.fetchPokemonDetails.mockResolvedValue(apiPokemon('charizard-gmax', 1, { height: 280 }));
    const gmax = { regular: 'g.png', shiny: 'g-s.png', variety: 'charizard-gmax' };

    const result = await loadGigamaxData(base({ sprites: { regular: 'b', shiny: null, gmax } as any }));

    expect(mocked.fetchPokemonDetails).toHaveBeenCalledWith('charizard-gmax');
    expect(result.sprites).toEqual({ regular: 'g.png', shiny: 'g-s.png', gmax });
    expect(result.height).toBe('28 m');
  });

  it('derives the name and sprites when nothing is stored', async () => {
    mocked.fetchPokemonDetails.mockResolvedValue(apiPokemon('charizard-gmax'));

    const result = await loadGigamaxData(base());

    expect(mocked.fetchPokemonDetails).toHaveBeenCalledWith('charizard-gmax');
    expect(result.sprites.regular).toBe('charizard-gmax.png');
  });

  it('returns the base pokemon on error', async () => {
    mocked.fetchPokemonDetails.mockRejectedValue(new Error('x'));
    const pokemon = base();
    expect(await loadGigamaxData(pokemon)).toBe(pokemon);
  });
});

describe('loadRegionalForm', () => {
  const sp = () => species({ name: 'rattata' });

  it('loads the form and maps evolutions to their regional variety ids', async () => {
    mocked.fetchEvolutionChain.mockResolvedValue({
      id: 2,
      chain: link(19, 'rattata', [link(20, 'raticate', [], [details({ min_level: 20 })])]),
    } as any);
    mocked.fetchPokemonDetails.mockImplementation(async (name) => apiPokemon(String(name), name === 'raticate-alola' ? 10092 : 10091));

    const result = await loadRegionalForm(base({ pokedex_id: 19 }), 'alola', sp());

    expect(result.sprites.regular).toBe('rattata-alola.png');
    expect(result.evolution!.next![0]).toMatchObject({ pokedex_id: 20, varietyId: 10092 });
  });

  it('maps pre-evolutions and keeps original steps when the regional variety does not exist', async () => {
    mocked.fetchEvolutionChain.mockResolvedValue({
      id: 2,
      chain: link(19, 'rattata', [link(20, 'raticate', [link(21, 'x', [], [])], [details({ min_level: 20 })])]),
    } as any);
    mocked.fetchPokemonDetails.mockImplementation(async (name) => {
      if (name === 'raticate-alola') return apiPokemon('raticate-alola', 10092);
      if (name === 'rattata-alola') return apiPokemon('rattata-alola', 10091);
      throw new Error('404');
    });
    const result = await loadRegionalForm(base({ pokedex_id: 20 }), 'alola', species({ name: 'raticate' }));
    expect(result.evolution!.pre![0]).toMatchObject({ pokedex_id: 19, varietyId: 10091 });
    expect(result.evolution!.next![0].varietyId).toBeUndefined();
  });

  it('returns the base pokemon when the form cannot be loaded', async () => {
    mocked.fetchPokemonDetails.mockRejectedValue(new Error('x'));
    const pokemon = base();
    expect(await loadRegionalForm(pokemon, 'alola', sp())).toBe(pokemon);
  });
});
