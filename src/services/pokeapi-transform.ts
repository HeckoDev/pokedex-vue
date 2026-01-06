import type { Pokemon, LocalizedName, Type, Stats, Sprite, Evolution, EvolutionStep, RegionalForm } from '@/types/pokemon';
import type { PokeAPIPokemon, PokeAPISpecies, PokeAPIEvolutionLink } from './pokeapi';
import { getGenerationNumber, fetchEvolutionChain, getEvolutionChainId, fetchPokemonVarieties, fetchPokemonDetails } from './pokeapi';

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

// Convert evolution conditions to readable text
function getEvolutionCondition(details: any): string {
  if (!details || details.length === 0) {
    return '';
  }
  
  const detail = details[0];
  
  if (detail.min_level) {
    return `Niveau ${detail.min_level}`;
  }
  
  if (detail.item) {
    const itemName = detail.item.name.replace(/-/g, ' ');
    return `Utiliser ${itemName}`;
  }
  
  if (detail.trigger.name === 'trade') {
    return 'Échange';
  }
  
  if (detail.min_happiness) {
    return `Bonheur ${detail.min_happiness}+`;
  }
  
  if (detail.known_move) {
    return `Apprendre ${detail.known_move.name}`;
  }
  
  return 'Condition spéciale';
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
            condition: getEvolutionCondition(evolution.evolution_details)
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

// Load and transform mega-evolutions and gigamax forms from API
async function loadMegaAndGigamaxForms(
  species: PokeAPISpecies
): Promise<{ mega: any[] | null; gmax: any | null }> {
  try {
    if (!species.varieties || species.varieties.length <= 1) {
      return { mega: null, gmax: null };
    }
    
    const megaEvolutions: any[] = [];
    let gigamaxForm: any = null;
    
    for (const variety of species.varieties) {
      if (variety.is_default) continue;
      
      const varietyName = variety.pokemon.name.toLowerCase();
      
      if (varietyName.includes('-mega')) {
        try {
          const megaPokemon = await fetchPokemonDetails(varietyName);
          const sprites = transformSprites(megaPokemon);
          
          let orbe = 'Méga-Gemme';
          if (varietyName.includes('-mega-x')) {
            const baseName = species.names.find(n => n.language.name === 'fr')?.name || species.name;
            orbe = `${baseName}ite X`;
          } else if (varietyName.includes('-mega-y')) {
            const baseName = species.names.find(n => n.language.name === 'fr')?.name || species.name;
            orbe = `${baseName}ite Y`;
          } else if (varietyName.includes('-z')) {
            const baseName = species.names.find(n => n.language.name === 'fr')?.name || species.name;
            orbe = `${baseName}ite Z`;
          } else {
            const baseName = species.names.find(n => n.language.name === 'fr')?.name || species.name;
            orbe = `${baseName}ite`;
          }
          
          megaEvolutions.push({
            orbe,
            sprites: {
              regular: sprites.regular,
              shiny: sprites.shiny
            }
          });
        } catch (error) {
          console.warn(`Error loading mega-evolution ${varietyName}:`, error);
        }
      }
      
      if (varietyName.includes('-gmax')) {
        try {
          const gmaxPokemon = await fetchPokemonDetails(varietyName);
          const sprites = transformSprites(gmaxPokemon);
          
          gigamaxForm = {
            regular: sprites.regular,
            shiny: sprites.shiny
          };
        } catch (error) {
          console.warn(`Error loading Gigamax form ${varietyName}:`, error);
        }
      }
    }
    
    return {
      mega: megaEvolutions.length > 0 ? megaEvolutions : null,
      gmax: gigamaxForm
    };
  } catch (error) {
    console.warn("Error loading mega/gigamax:", error);
    return { mega: null, gmax: null };
  }
}

// Transform complete evolution chain
async function transformEvolutionChain(
  species: PokeAPISpecies,
  currentPokemonId: number,
  skipMegaAndGigamax: boolean = false
): Promise<Evolution | null> {
  try {
    const chainId = getEvolutionChainId(species.evolution_chain.url);
    const chain = await fetchEvolutionChain(chainId);
    
    const { pre, next } = extractEvolutionsFromLink(chain.chain, currentPokemonId);
    
    // Ne pas charger les mégas/gigamax pour les formes régionales
    const { mega: megaEvolutions } = skipMegaAndGigamax ? { mega: null } : await loadMegaAndGigamaxForms(species);
    
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

// Transform PokeAPI Pokemon to local format
export async function transformPokemon(
  apiPokemon: PokeAPIPokemon,
  species: PokeAPISpecies,
  existingPokemon?: Pokemon
): Promise<Pokemon> {
  const [evolution, formes, { gmax: gigamaxForm }] = await Promise.all([
    transformEvolutionChain(species, apiPokemon.id),
    transformRegionalForms(species),
    loadMegaAndGigamaxForms(species)
  ]);

  // Utiliser uniquement les données de l'API
  const finalSprites = {
    ...transformSprites(apiPokemon),
    gmax: gigamaxForm
  };

  return {
    pokedex_id: apiPokemon.id,
    generation: getGenerationNumber(species.generation.name),
    category: extractCategory(species),
    name: extractLocalizedNames(species),
    sprites: finalSprites,
    types: transformTypes(apiPokemon),
    talents: existingPokemon?.talents || null, // Talents du JSON local (capacités spéciales)
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
  megaVariant: string
): Promise<Pokemon> {
  try {
    const baseName = basePokemon.name.en.toLowerCase();
    const megaName = megaVariant === 'X' || megaVariant === 'Y' 
      ? `${baseName}-mega-${megaVariant.toLowerCase()}`
      : `${baseName}-mega`;
    
    const megaPokemon = await fetchPokemonDetails(megaName);
    
    const megaSprites = basePokemon.evolution?.mega?.find(m => 
      m.orbe.toLowerCase().includes(megaVariant.toLowerCase())
    )?.sprites || transformSprites(megaPokemon);
    
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
    const baseName = basePokemon.name.en.toLowerCase();
    const gmaxName = `${baseName}-gmax`;
    
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
    
    console.log('loadRegionalForm called:', formPokemonName);
    const formPokemonData = await fetchPokemonDetails(formPokemonName);
    console.log('formPokemonData fetched, id:', formPokemonData.id);
    
    // Charger la chaîne d'évolution de base
    const baseEvolution = await transformEvolutionChain(species, basePokemon.pokedex_id, true);
    console.log('baseEvolution loaded:', baseEvolution);
    
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
            } catch (error) {
              console.log(`No regional form for pre-evolution ${pre.name}`);
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
            } catch (error) {
              console.log(`No regional form for evolution ${next.name}`);
              return next;
            }
          })
        );
      }
    }
    
    console.log('regionalEvolution created:', regionalEvolution);
    
    const result = {
      ...basePokemon,
      sprites: transformSprites(formPokemonData),
      types: transformTypes(formPokemonData),
      stats: transformStats(formPokemonData),
      height: `${formPokemonData.height / 10} m`,
      weight: `${formPokemonData.weight / 10} kg`,
      evolution: regionalEvolution,
    };
    
    console.log('Returning regional form with evolution:', result.evolution);
    return result;
  } catch (error) {
    console.error(`Error loading regional form ${formeName}:`, error);
    return basePokemon;
  }
}
