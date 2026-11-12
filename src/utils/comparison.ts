import type { Pokemon, Stats } from "@/types/pokemon";

export type StatKey = keyof Stats;
export type Winner = "a" | "b" | "tie";

export const STAT_KEYS: StatKey[] = ["hp", "atk", "def", "spe_atk", "spe_def", "vit"];

export const statTotal = (stats: Stats | null): number =>
  stats ? STAT_KEYS.reduce((sum, key) => sum + stats[key], 0) : 0;

export const compareValues = (a: number, b: number): Winner =>
  a === b ? "tie" : a > b ? "a" : "b";

// "1.7 m" / "90.5 kg" -> number (0 when unknown)
export const parseMeasure = (value: string | null): number => {
  const n = parseFloat(value ?? "");
  return Number.isFinite(n) ? n : 0;
};

export const compareStat = (a: Pokemon, b: Pokemon, key: StatKey): Winner =>
  compareValues(a.stats?.[key] ?? 0, b.stats?.[key] ?? 0);
