import type { Language } from "@/composables/usePokemon";
import type { LocalizedName } from "@/types/pokemon";

// The app uses "jp" while PokeAPI uses "ja" for Japanese
const API_LANGUAGE: Record<Language, string> = { fr: "fr", en: "en", jp: "ja" };

export const toApiLanguage = (lang: Language): string => API_LANGUAGE[lang];

// Local data stores type names in French; this maps them to every UI language
const TYPE_LABELS: Record<string, LocalizedName> = {
  Normal: { fr: "Normal", en: "Normal", jp: "ノーマル" },
  Feu: { fr: "Feu", en: "Fire", jp: "ほのお" },
  Eau: { fr: "Eau", en: "Water", jp: "みず" },
  Électrik: { fr: "Électrik", en: "Electric", jp: "でんき" },
  Plante: { fr: "Plante", en: "Grass", jp: "くさ" },
  Glace: { fr: "Glace", en: "Ice", jp: "こおり" },
  Combat: { fr: "Combat", en: "Fighting", jp: "かくとう" },
  Poison: { fr: "Poison", en: "Poison", jp: "どく" },
  Sol: { fr: "Sol", en: "Ground", jp: "じめん" },
  Vol: { fr: "Vol", en: "Flying", jp: "ひこう" },
  Psy: { fr: "Psy", en: "Psychic", jp: "エスパー" },
  Insecte: { fr: "Insecte", en: "Bug", jp: "むし" },
  Roche: { fr: "Roche", en: "Rock", jp: "いわ" },
  Spectre: { fr: "Spectre", en: "Ghost", jp: "ゴースト" },
  Dragon: { fr: "Dragon", en: "Dragon", jp: "ドラゴン" },
  Ténèbres: { fr: "Ténèbres", en: "Dark", jp: "あく" },
  Acier: { fr: "Acier", en: "Steel", jp: "はがね" },
  Fée: { fr: "Fée", en: "Fairy", jp: "フェアリー" },
};

/** Localized label of a type; unknown names are returned unchanged. */
export const getTypeLabel = (typeName: string, lang: Language): string =>
  TYPE_LABELS[typeName]?.[lang] ?? typeName;

/**
 * Picks the entry matching the language, falling back to English then French
 * (PokeAPI does not translate every text in every language).
 */
export function pickLocalizedEntry<T extends { language: { name: string } }>(
  entries: T[] | undefined,
  lang: Language
): T | undefined {
  if (!entries) return undefined;
  const wanted = [toApiLanguage(lang), ...(lang === "jp" ? ["ja-hrkt"] : []), "en", "fr"];
  for (const code of wanted) {
    const match = entries.find((entry) => entry.language.name === code);
    if (match) return match;
  }
  return undefined;
}

// Game versions whose Pokédex entries describe each alternative form
const REGION_VERSIONS: Record<string, string[]> = {
  alola: ["ultra-sun", "ultra-moon", "sun", "moon"],
  galar: ["sword", "shield"],
  hisui: ["legends-arceus"],
  paldea: ["scarlet", "violet"],
};
const MEGA_VERSIONS = ["x", "y", "omega-ruby", "alpha-sapphire"];
const GMAX_VERSIONS = ["sword", "shield"];

export const getFormVersions = (type: string, region?: string, variety?: string): string[] => {
  if (type === "regional") return (region && REGION_VERSIONS[region]) || [];
  if (type === "mega") {
    // Mega X / Mega Y: prefer the matching X / Y game so each variant gets its own text
    const letter = /-mega-([xy])$/.exec(variety ?? "")?.[1];
    return letter ? [letter, ...MEGA_VERSIONS.filter((v) => v !== letter)] : MEGA_VERSIONS;
  }
  if (type === "gigamax") return GMAX_VERSIONS;
  return [];
};

/** Flavor text in the best available language, preferring entries from the given game versions. */
export function pickFlavorText<T extends { language: { name: string }; version?: { name: string } }>(
  entries: T[] | undefined,
  lang: Language,
  versions: string[] = []
): T | undefined {
  const base = pickLocalizedEntry(entries, lang);
  if (!base || versions.length === 0) return base;
  const sameLanguage = entries!.filter((e) => e.language.name === base.language.name);
  for (const version of versions) {
    const match = sameLanguage.find((e) => e.version?.name === version);
    if (match) return match;
  }
  return base;
}
