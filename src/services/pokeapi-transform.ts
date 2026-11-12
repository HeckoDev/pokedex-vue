import type { Pokemon, LocalizedName, Type, Stats, Sprite, SpriteSet, Evolution, EvolutionStep, MegaEvolution, RegionalForm, Talent } from '@/types/pokemon';
import type { PokeAPIPokemon, PokeAPISpecies, PokeAPIEvolutionLink } from './pokeapi';
import { getGenerationNumber, fetchEvolutionChain, getEvolutionChainId, fetchPokemonVarieties, fetchPokemonDetails, fetchAbility } from './pokeapi';

// Pokemon type to local image mapping
const typeImageMap: Record<string, string> = {
  normal: '/types/normal.png',
  fire: '/types/feu.png',
  water: '/types/eau.png',
  electric: '/types/electrik.png',
  grass: '/types/plante.png',
  ice: '/types/glace.png',
  fighting: '/types/combat.png',
  poison: '/types/poison.png',
  ground: '/types/sol.png',
  flying: '/types/vol.png',
  psychic: '/types/psy.png',
  bug: '/types/insecte.png',
  rock: '/types/roche.png',
  ghost: '/types/spectre.png',
  dragon: '/types/dragon.png',
  dark: '/types/tenebres.png',
  steel: '/types/acier.png',
  fairy: '/types/fee.png',
};

// Type names EN -> FR mapping
const typeNameMap: Record<string, string> = {
  normal: 'Normal',
  fire: 'Feu',
  water: 'Eau',
  electric: 'Électrik',
  grass: 'Plante',
  ice: 'Glace',
  fighting: 'Combat',
  poison: 'Poison',
  ground: 'Sol',
  flying: 'Vol',
  psychic: 'Psy',
  bug: 'Insecte',
  rock: 'Roche',
  ghost: 'Spectre',
  dragon: 'Dragon',
  dark: 'Ténèbres',
  steel: 'Acier',
  fairy: 'Fée',
};

// Extract localized Pokemon names (FR, EN, JP)
function extractLocalizedNames(species: PokeAPISpecies): LocalizedName {
  const frName = species.names.find(n => n.language.name === 'fr')?.name || species.name;
  const enName = species.names.find(n => n.language.name === 'en')?.name || species.name;
  const jpName = species.names.find(n => n.language.name === 'ja')?.name || species.name;

  return {
    fr: frName,
    en: enName,
    jp: jpName,
  };
}

// Extract Pokemon category/genus
function extractCategory(species: PokeAPISpecies): string {
  const frGenus = species.genera.find(g => g.language.name === 'fr')?.genus || '';
  return frGenus.replace(' Pokémon', '');
}

// Transform API types to local format
function transformTypes(apiPokemon: PokeAPIPokemon): Type[] {
  return apiPokemon.types.map(t => ({
    name: typeNameMap[t.type.name] || t.type.name,
    image: typeImageMap[t.type.name] || '',
  }));
}

// Transform API stats to local format
function transformStats(apiPokemon: PokeAPIPokemon): Stats {
  const statsMap = new Map(
    apiPokemon.stats.map(s => [s.stat.name, s.base_stat])
  );

  return {
    hp: statsMap.get('hp') || 0,
    atk: statsMap.get('attack') || 0,
    def: statsMap.get('defense') || 0,
    spe_atk: statsMap.get('special-attack') || 0,
    spe_def: statsMap.get('special-defense') || 0,
    vit: statsMap.get('speed') || 0,
  };
}

// Transform API sprites to local format (prefer official artwork)
function transformSprites(apiPokemon: PokeAPIPokemon): Sprite {
  const officialArt = apiPokemon.sprites.other['official-artwork'];
  const home = apiPokemon.sprites.other.home;

  const regularSprite = officialArt.front_default || home.front_default || apiPokemon.sprites.front_default || '';
  const shinySprite = officialArt.front_shiny || home.front_shiny || apiPokemon.sprites.front_shiny;

  return {
    regular: regularSprite,
    shiny: shinySprite,
    gmax: null,
  };
}

// Extract Pokemon ID from PokeAPI URL
function getPokemonIdFromUrl(url: string): number {
  const parts = url.split('/');
  return parseInt(parts[parts.length - 2]);
}

type EvolutionCondition = Pick<EvolutionStep, 'condition' | 'conditionKey' | 'conditionVars' | 'itemSlug' | 'moveSlug'>;

const formatSlug = (slug: string): string => slug.replace(/-/g, ' ');

// Convert evolution conditions to a translatable description (French text kept as fallback)
function getEvolutionCondition(details: PokeAPIEvolutionLink['evolution_details']): EvolutionCondition {
  if (!details || details.length === 0) {
    return { condition: '' };
  }

  const detail = details[0];

  if (detail.min_level) {
    const level = String(detail.min_level);
    return { condition: `Niveau ${level}`, conditionKey: 'evolutionCondition.level', conditionVars: { level } };
  }

  if (detail.item) {
    const item = formatSlug(detail.item.name);
    return { condition: `Utiliser ${item}`, conditionKey: 'evolutionCondition.useItem', conditionVars: { item }, itemSlug: detail.item.name };
  }

  if (detail.trigger.name === 'trade') {
    return { condition: 'Échange', conditionKey: 'evolutionCondition.trade' };
  }

  if (detail.min_happiness) {
    const value = String(detail.min_happiness);
    return { condition: `Bonheur ${value}+`, conditionKey: 'evolutionCondition.happiness', conditionVars: { value } };
  }

  if (detail.known_move) {
    const move = formatSlug(detail.known_move.name);
    return { condition: `Apprendre ${move}`, conditionKey: 'evolutionCondition.learnMove', conditionVars: { move }, moveSlug: detail.known_move.name };
  }

  return { condition: 'Condition spéciale', conditionKey: 'evolutionCondition.special' };
}

// Extract evolutions from evolution chain link
function extractEvolutionsFromLink(
  link: PokeAPIEvolutionLink,
  currentPokemonId: number
): { pre: EvolutionStep[] | null; next: EvolutionStep[] | null } {
  const pre: EvolutionStep[] = [];
  const next: EvolutionStep[] = [];
  
  function traverse(currentLink: PokeAPIEvolutionLink, parent: PokeAPIEvolutionLink | null = null) {
    const pokemonId = getPokemonIdFromUrl(currentLink.species.url);
    
    if (pokemonId === currentPokemonId) {
      if (parent) {
        const parentId = getPokemonIdFromUrl(parent.species.url);
        pre.push({
          pokedex_id: parentId,
          name: parent.species.name,
          condition: ''
        });
      }
      
      if (currentLink.evolves_to && currentLink.evolves_to.length > 0) {
        currentLink.evolves_to.forEach(evolution => {
          const evoId = getPokemonIdFromUrl(evolution.species.url);
          next.push({
            pokedex_id: evoId,
            name: evolution.species.name,
            ...getEvolutionCondition(evolution.evolution_details)
          });
        });
      }
    }
    
    if (currentLink.evolves_to && currentLink.evolves_to.length > 0) {
      currentLink.evolves_to.forEach(evolution => {
        traverse(evolution, currentLink);
      });
    }
  }
  
  traverse(link);
  
  return {
    pre: pre.length > 0 ? pre : null,
    next: next.length > 0 ? next : null
  };
}

interface MegaGigamaxForms {
  mega: MegaEvolution[] | null;
  gmax: SpriteSet | null;
}

const MEGA_SUFFIX_LABELS: Array<[string, string]> = [
  ['-mega-x', 'ite X'],
  ['-mega-y', 'ite Y'],
  ['-mega-z', 'ite Z'],
];

// Load and transform mega-evolutions and gigamax forms from API (varieties are fetched in parallel)
async function loadMegaAndGigamaxForms(species: PokeAPISpecies): Promise<MegaGigamaxForms> {
  const varieties = (species.varieties ?? []).filter(v => !v.is_default);
  if (varieties.length === 0) {
    return { mega: null, gmax: null };
  }

  const baseName = species.names.find(n => n.language.name === 'fr')?.name || species.name;

  const results = await Promise.all(varieties.map(async (variety) => {
    const varietyName = variety.pokemon.name.toLowerCase();
    const isMega = varietyName.includes('-mega');
    const isGmax = varietyName.includes('-gmax');
    if (!isMega && !isGmax) return null;

    try {
      const sprites = transformSprites(await fetchPokemonDetails(varietyName));
      if (isGmax) {
        return { gmax: { regular: sprites.regular, shiny: sprites.shiny, variety: varietyName } as SpriteSet };
      }
      const suffix = MEGA_SUFFIX_LABELS.find(([key]) => varietyName.includes(key))?.[1] ?? 'ite';
      return {
        mega: {
          orbe: `${baseName}${suffix}`,
          variety: varietyName,
          sprites: { regular: sprites.regular, shiny: sprites.shiny },
        } as MegaEvolution,
      };
    } catch (error) {
      console.warn(`Error loading form ${varietyName}:`, error);
      return null;
    }
  }));

  const mega = results.flatMap(r => (r && 'mega' in r && r.mega ? [r.mega] : []));
  const gmax = results.find(r => r && 'gmax' in r)?.gmax ?? null;

  return { mega: mega.length > 0 ? mega : null, gmax };
}

// Transform complete evolution chain
async function transformEvolutionChain(
  species: PokeAPISpecies,
  currentPokemonId: number,
  megaEvolutions: MegaEvolution[] | null = null
): Promise<Evolution | null> {
  try {
    const chainId = getEvolutionChainId(species.evolution_chain.url);
    const chain = await fetchEvolutionChain(chainId);
    
    const { pre, next } = extractEvolutionsFromLink(chain.chain, currentPokemonId);
    
    if (!pre && !next && !megaEvolutions) {
      return null;
    }
    
    return {
      pre,
      next,
      mega: megaEvolutions
    };
  } catch (error) {
    console.warn(`Error fetching evolution chain for ${currentPokemonId}:`, error);
    return null;
  }
}

// Transform varieties to regional forms
async function transformRegionalForms(
  species: PokeAPISpecies
): Promise<RegionalForm[] | null> {
  try {
    const varieties = await fetchPokemonVarieties(species);
    
    if (varieties.length === 0) {
      return null;
    }
    
    const forms: RegionalForm[] = [];
    
    for (const variety of varieties) {
      let region = '';
      const name = variety.name.toLowerCase();
      
      if (name.includes('alola')) region = 'alola';
      else if (name.includes('galar')) region = 'galar';
      else if (name.includes('hisui')) region = 'hisui';
      else if (name.includes('paldea')) region = 'paldea';
      
      if (region) {
        forms.push({
          region,
          name: {
            fr: variety.name,
            en: variety.name,
            jp: variety.name
          }
        });
      }
    }
    
    return forms.length > 0 ? forms : null;
  } catch (error) {
    console.warn(`Error fetching regional forms:`, error);
    return null;
  }
}

// Localized abilities from the API; falls back to the local JSON talents on failure
async function transformTalents(apiPokemon: PokeAPIPokemon, fallback: Talent[] | null): Promise<Talent[] | null> {
  try {
    const talents = await Promise.all(apiPokemon.abilities.map(async ({ ability, is_hidden }) => {
      const data = await fetchAbility(ability.name);
      const nameOf = (lang: string) => data.names.find(n => n.language.name === lang)?.name;
      const en = nameOf('en') || formatSlug(ability.name);
      const names: LocalizedName = { fr: nameOf('fr') || en, en, jp: nameOf('ja') || nameOf('ja-hrkt') || en };
      return { name: names.fr, tc: is_hidden, names };
    }));
    return talents.length > 0 ? talents : fallback;
  } catch (error) {
    console.warn('Error loading abilities:', error);
    return fallback;
  }
}

// Transform PokeAPI Pokemon to local format
export async function transformPokemon(
  apiPokemon: PokeAPIPokemon,
  species: PokeAPISpecies,
  existingPokemon?: Pokemon
): Promise<Pokemon> {
  const { mega, gmax: gigamaxForm } = await loadMegaAndGigamaxForms(species);
  const [evolution, formes, talents] = await Promise.all([
    transformEvolutionChain(species, apiPokemon.id, mega),
    transformRegionalForms(species),
    transformTalents(apiPokemon, existingPokemon?.talents ?? null),
  ]);

  // Utiliser uniquement les données de l'API
  const finalSprites = {
    ...transformSprites(apiPokemon),
    gmax: gigamaxForm
  };

  return {
    pokedex_id: apiPokemon.id,
    species_name: species.name,
    generation: getGenerationNumber(species.generation.name),
    category: extractCategory(species),
    name: extractLocalizedNames(species),
    sprites: finalSprites,
    types: transformTypes(apiPokemon),
    talents,
    stats: transformStats(apiPokemon),
    resistances: null,
    evolution: evolution,
    height: `${apiPokemon.height / 10} m`,
    weight: `${apiPokemon.weight / 10} kg`,
    egg_groups: null,
    sexe: null,
    catch_rate: null,
    level_100: null,
    formes,
  };
}

// Transform Pokemon list from API
export async function transformPokemonList(
  apiData: Array<{ pokemon: PokeAPIPokemon; species: PokeAPISpecies }>
): Promise<Pokemon[]> {
  const promises = apiData.map(({ pokemon, species }) => transformPokemon(pokemon, species));
  return Promise.all(promises);
}

// Load complete mega-evolution data from API
export async function loadMegaEvolutionData(
  basePokemon: Pokemon,
  megaVariant: string,
  varietyName?: string
): Promise<Pokemon> {
  try {
    const baseName = basePokemon.species_name ?? basePokemon.name.en.toLowerCase();
    const megaName = varietyName
      ?? (megaVariant === 'X' || megaVariant === 'Y' || megaVariant === 'Z'
        ? `${baseName}-mega-${megaVariant.toLowerCase()}`
        : `${baseName}-mega`);

    const megaPokemon = await fetchPokemonDetails(megaName);

    const megaSprites = basePokemon.evolution?.mega?.find(m => m.variety === megaName)?.sprites
      || transformSprites(megaPokemon);
    
    return {
      ...basePokemon,
      sprites: {
        regular: megaSprites.regular,
        shiny: megaSprites.shiny,
        gmax: null
      },
      types: transformTypes(megaPokemon),
      stats: transformStats(megaPokemon),
      height: `${megaPokemon.height / 10} m`,
      weight: `${megaPokemon.weight / 10} kg`,
      talents: await transformTalents(megaPokemon, basePokemon.talents),
    };
  } catch (error) {
    console.error(`Error loading mega-evolution:`, error);
    return basePokemon;
  }
}

// Load complete Gigamax data from API
export async function loadGigamaxData(
  basePokemon: Pokemon
): Promise<Pokemon> {
  try {
    const gmaxName = basePokemon.sprites.gmax?.variety
      ?? `${basePokemon.species_name ?? basePokemon.name.en.toLowerCase()}-gmax`;
    
    const gmaxPokemon = await fetchPokemonDetails(gmaxName);
    
    const gmaxSprites = basePokemon.sprites.gmax || transformSprites(gmaxPokemon);
    
    return {
      ...basePokemon,
      sprites: {
        regular: typeof gmaxSprites === 'string' ? gmaxSprites : gmaxSprites.regular,
        shiny: typeof gmaxSprites === 'object' && gmaxSprites.shiny ? gmaxSprites.shiny : null,
        gmax: gmaxSprites
      },
      types: transformTypes(gmaxPokemon),
      stats: transformStats(gmaxPokemon),
      height: `${gmaxPokemon.height / 10} m`,
      weight: `${gmaxPokemon.weight / 10} kg`,
      talents: await transformTalents(gmaxPokemon, basePokemon.talents),
    };
  } catch (error) {
    console.error(`Error loading Gigamax:`, error);
    return basePokemon;
  }
}

// Load specific regional form data from API
export async function loadRegionalForm(
  basePokemon: Pokemon,
  formeName: string,
  species: PokeAPISpecies
): Promise<Pokemon> {
  try {
    const baseName = species.name.toLowerCase();
    const formPokemonName = `${baseName}-${formeName}`;
    
    const formPokemonData = await fetchPokemonDetails(formPokemonName);
    
    // Charger la chaîne d'évolution de base
    const baseEvolution = await transformEvolutionChain(species, basePokemon.pokedex_id);
    
    // Convertir les évolutions vers leurs formes régionales
    let regionalEvolution: Evolution | null = null;
    if (baseEvolution) {
      regionalEvolution = { ...baseEvolution };
      
      // Convertir les pré-évolutions
      if (baseEvolution.pre && baseEvolution.pre.length > 0) {
        regionalEvolution.pre = await Promise.all(
          baseEvolution.pre.map(async (pre) => {
            try {
              const preName = pre.name.toLowerCase();
              const preRegionalName = `${preName}-${formeName}`;
              const preRegionalPokemon = await fetchPokemonDetails(preRegionalName);
              // Garder le pokedex_id original pour la navigation, mais utiliser l'ID de variété pour le sprite
              return {
                ...pre,
                varietyId: preRegionalPokemon.id
              };
            } catch {
              return pre;
            }
          })
        );
      }
      
      // Convertir les évolutions suivantes
      if (baseEvolution.next && baseEvolution.next.length > 0) {
        regionalEvolution.next = await Promise.all(
          baseEvolution.next.map(async (next) => {
            try {
              const nextName = next.name.toLowerCase();
              const nextRegionalName = `${nextName}-${formeName}`;
              const nextRegionalPokemon = await fetchPokemonDetails(nextRegionalName);
              // Garder le pokedex_id original pour la navigation, mais utiliser l'ID de variété pour le sprite
              return {
                ...next,
                varietyId: nextRegionalPokemon.id
              };
            } catch {
              return next;
            }
          })
        );
      }
    }
    
    
    const result = {
      ...basePokemon,
      sprites: transformSprites(formPokemonData),
      types: transformTypes(formPokemonData),
      stats: transformStats(formPokemonData),
      height: `${formPokemonData.height / 10} m`,
      weight: `${formPokemonData.weight / 10} kg`,
      talents: await transformTalents(formPokemonData, basePokemon.talents),
      evolution: regionalEvolution,
    };
    
    return result;
  } catch (error) {
    console.error(`Error loading regional form ${formeName}:`, error);
    return basePokemon;
  }
}
