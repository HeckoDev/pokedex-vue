import type { Pokemon } from "@/types/pokemon";
import flags from "@/data/pokemonFlags.json";

export type FormFilter = "mega" | "gmax" | "alola" | "galar" | "hisui" | "paldea";
export type RarityFilter = "legendary" | "mythical";
export type StageFilter = "basic" | "middle" | "final" | "single";

export interface ExtraFilters {
  forms: FormFilter[];
  rarities: RarityFilter[];
  stages: StageFilter[];
}

export const FORM_FILTERS: FormFilter[] = ["mega", "gmax", "alola", "galar", "hisui", "paldea"];
export const RARITY_FILTERS: RarityFilter[] = ["legendary", "mythical"];
export const STAGE_FILTERS: StageFilter[] = ["basic", "middle", "final", "single"];

const megaForms = flags.mega as Record<string, number[]>;
const legendaryIds = new Set(flags.legendary);
const mythicalIds = new Set(flags.mythical);

export const emptyExtraFilters = (): ExtraFilters => ({ forms: [], rarities: [], stages: [] });

export const countExtraFilters = (f: ExtraFilters): number =>
  f.forms.length + f.rarities.length + f.stages.length;

export function getEvolutionStage(pokemon: Pokemon): StageFilter {
  const hasPre = (pokemon.evolution?.pre?.length ?? 0) > 0;
  const hasNext = (pokemon.evolution?.next?.length ?? 0) > 0;
  if (hasPre && hasNext) return "middle";
  if (hasPre) return "final";
  if (hasNext) return "basic";
  return "single";
}

function hasForm(pokemon: Pokemon, form: FormFilter): boolean {
  if (form === "mega") {
    return pokemon.pokedex_id in megaForms || (pokemon.evolution?.mega?.length ?? 0) > 0;
  }
  if (form === "gmax") return !!pokemon.sprites.gmax;
  return pokemon.formes?.some((f) => f.region === form) ?? false;
}

// Within one group the criteria are OR-ed; the groups are AND-ed together.
export function matchesExtraFilters(pokemon: Pokemon, f: ExtraFilters): boolean {
  if (f.forms.length > 0 && !f.forms.some((form) => hasForm(pokemon, form))) return false;
  if (
    f.rarities.length > 0 &&
    !f.rarities.some((r) =>
      r === "legendary" ? legendaryIds.has(pokemon.pokedex_id) : mythicalIds.has(pokemon.pokedex_id)
    )
  ) {
    return false;
  }
  if (f.stages.length > 0 && !f.stages.includes(getEvolutionStage(pokemon))) return false;
  return true;
}

const ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

export interface FormDisplay {
  form: FormFilter;
  sprite: string;
}

// Sprite of the first selected form the Pokémon actually has (null when the
// list should keep showing the normal form).
export function getFormDisplay(
  pokemon: Pokemon,
  forms: FormFilter[],
  shiny: boolean
): FormDisplay | null {
  for (const form of FORM_FILTERS.filter((f) => forms.includes(f))) {
    if (form === "mega") {
      const sprites = pokemon.evolution?.mega?.[0]?.sprites;
      if (sprites) return { form, sprite: (shiny && sprites.shiny) || sprites.regular };
      // Newer Mégas are missing from the local data: use the PokeAPI artwork
      const id = megaForms[pokemon.pokedex_id]?.[0];
      if (id) return { form, sprite: `${ARTWORK_BASE}/${shiny ? "shiny/" : ""}${id}.png` };
    } else if (form === "gmax") {
      const gmax = pokemon.sprites.gmax;
      if (gmax) return { form, sprite: (shiny && gmax.shiny) || gmax.regular };
    } else {
      const id = (flags.regional as Record<string, Partial<Record<FormFilter, number>>>)[
        pokemon.pokedex_id
      ]?.[form];
      if (id) return { form, sprite: `${ARTWORK_BASE}/${shiny ? "shiny/" : ""}${id}.png` };
    }
  }
  return null;
}
