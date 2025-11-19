export interface LocalizedName {
  fr: string;
  en: string;
  jp: string;
}

export interface Sprite {
  regular: string;
  shiny: string | null;
  gmax: string | null;
}

export interface Type {
  name: string;
  image: string;
}

export interface Talent {
  name: string;
  tc: boolean;
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spe_atk: number;
  spe_def: number;
  vit: number;
}

export interface Resistance {
  name: string;
  multiplier: number;
}

export interface EvolutionStep {
  pokedex_id: number;
  name: string;
  condition: string;
}

export interface Evolution {
  pre: EvolutionStep[] | null;
  next: EvolutionStep[] | null;
  mega: any;
}

export interface Sexe {
  male: number;
  female: number;
}

export interface Pokemon {
  pokedex_id: number;
  generation: number;
  category: string;
  name: LocalizedName;
  sprites: Sprite;
  types: Type[] | null;
  talents: Talent[] | null;
  stats: Stats | null;
  resistances: Resistance[] | null;
  evolution: Evolution | null;
  height: string | null;
  weight: string | null;
  egg_groups: string[] | null;
  sexe: Sexe | null;
  catch_rate: number | null;
  level_100: number | null;
  formes: any;
}
