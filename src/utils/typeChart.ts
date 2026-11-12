import type { Pokemon } from "@/types/pokemon";

// Type names are the French ones used by the local Pokédex data
export const ALL_TYPES = [
  "Normal", "Feu", "Eau", "Électrik", "Plante", "Glace", "Combat", "Poison", "Sol",
  "Vol", "Psy", "Insecte", "Roche", "Spectre", "Dragon", "Ténèbres", "Acier", "Fée",
] as const;

export type TypeName = (typeof ALL_TYPES)[number];

interface Attack {
  double?: TypeName[];
  half?: TypeName[];
  none?: TypeName[];
}

// What each attacking type does to defending types (anything not listed is x1)
const ATTACK_CHART: Record<TypeName, Attack> = {
  Normal: { half: ["Roche", "Acier"], none: ["Spectre"] },
  Feu: { double: ["Plante", "Glace", "Insecte", "Acier"], half: ["Feu", "Eau", "Roche", "Dragon"] },
  Eau: { double: ["Feu", "Sol", "Roche"], half: ["Eau", "Plante", "Dragon"] },
  Électrik: { double: ["Eau", "Vol"], half: ["Électrik", "Plante", "Dragon"], none: ["Sol"] },
  Plante: { double: ["Eau", "Sol", "Roche"], half: ["Feu", "Plante", "Poison", "Vol", "Insecte", "Dragon", "Acier"] },
  Glace: { double: ["Plante", "Sol", "Vol", "Dragon"], half: ["Feu", "Eau", "Glace", "Acier"] },
  Combat: { double: ["Normal", "Glace", "Roche", "Ténèbres", "Acier"], half: ["Poison", "Vol", "Psy", "Insecte", "Fée"], none: ["Spectre"] },
  Poison: { double: ["Plante", "Fée"], half: ["Poison", "Sol", "Roche", "Spectre"], none: ["Acier"] },
  Sol: { double: ["Feu", "Électrik", "Poison", "Roche", "Acier"], half: ["Plante", "Insecte"], none: ["Vol"] },
  Vol: { double: ["Plante", "Combat", "Insecte"], half: ["Électrik", "Roche", "Acier"] },
  Psy: { double: ["Combat", "Poison"], half: ["Psy", "Acier"], none: ["Ténèbres"] },
  Insecte: { double: ["Plante", "Psy", "Ténèbres"], half: ["Feu", "Combat", "Poison", "Vol", "Spectre", "Acier", "Fée"] },
  Roche: { double: ["Feu", "Glace", "Vol", "Insecte"], half: ["Combat", "Sol", "Acier"] },
  Spectre: { double: ["Psy", "Spectre"], half: ["Ténèbres"], none: ["Normal"] },
  Dragon: { double: ["Dragon"], half: ["Acier"], none: ["Fée"] },
  Ténèbres: { double: ["Psy", "Spectre"], half: ["Combat", "Ténèbres", "Fée"] },
  Acier: { double: ["Glace", "Roche", "Fée"], half: ["Feu", "Eau", "Électrik", "Acier"] },
  Fée: { double: ["Combat", "Dragon", "Ténèbres"], half: ["Feu", "Poison", "Acier"] },
};

const effectiveness = (attacker: TypeName, defender: string): number => {
  const attack = ATTACK_CHART[attacker];
  if (attack.none?.includes(defender as TypeName)) return 0;
  if (attack.double?.includes(defender as TypeName)) return 2;
  if (attack.half?.includes(defender as TypeName)) return 0.5;
  return 1;
};

/** Damage multiplier taken from each attacking type by a Pokémon with the given (1 or 2) types. */
export function computeDefense(defenderTypes: string[]): Record<TypeName, number> {
  const result = {} as Record<TypeName, number>;
  for (const attacker of ALL_TYPES) {
    result[attacker] = defenderTypes.reduce((acc, type) => acc * effectiveness(attacker, type), 1);
  }
  return result;
}

export const MULTIPLIER_ORDER = [4, 2, 1, 0.5, 0.25, 0] as const;

/** Groups attacking types by the multiplier they deal, in display order (x4 → x0). */
export function groupByMultiplier(defense: Record<TypeName, number>): { multiplier: number; types: TypeName[] }[] {
  return MULTIPLIER_ORDER.map((multiplier) => ({
    multiplier,
    types: ALL_TYPES.filter((type) => defense[type] === multiplier),
  })).filter((group) => group.types.length > 0);
}

const normalize = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Finds Pokémon whose name matches in any language (accent/case-insensitive); prefix matches first. */
export function searchPokemonByName(pokemons: Pokemon[], query: string, limit = 8): Pokemon[] {
  const needle = normalize(query);
  if (!needle) return [];

  const prefix: Pokemon[] = [];
  const contains: Pokemon[] = [];
  for (const pokemon of pokemons) {
    const names = Object.values(pokemon.name).map(normalize);
    if (names.some((name) => name.startsWith(needle))) prefix.push(pokemon);
    else if (names.some((name) => name.includes(needle)) || String(pokemon.pokedex_id) === needle) contains.push(pokemon);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, limit);
}
