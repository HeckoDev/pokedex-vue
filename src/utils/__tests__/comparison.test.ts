import { describe, it, expect } from "vitest";
import type { Pokemon } from "@/types/pokemon";
import { compareStat, compareValues, parseMeasure, statTotal } from "../comparison";

const stats = (n: number) => ({ hp: n, atk: n, def: n, spe_atk: n, spe_def: n, vit: n });
const mon = (s: ReturnType<typeof stats> | null) => ({ stats: s }) as Pokemon;

describe("comparison utils", () => {
  it("sums the six base stats", () => {
    expect(statTotal(stats(50))).toBe(300);
    expect(statTotal(null)).toBe(0);
  });

  it("designates the higher value, or a tie", () => {
    expect(compareValues(10, 5)).toBe("a");
    expect(compareValues(5, 10)).toBe("b");
    expect(compareValues(7, 7)).toBe("tie");
  });

  it("parses measures and tolerates missing data", () => {
    expect(parseMeasure("1.7 m")).toBe(1.7);
    expect(parseMeasure("90.5 kg")).toBe(90.5);
    expect(parseMeasure(null)).toBe(0);
    expect(parseMeasure("?")).toBe(0);
  });

  it("compares one stat, treating missing stats as 0", () => {
    expect(compareStat(mon(stats(80)), mon(stats(60)), "hp")).toBe("a");
    expect(compareStat(mon(null), mon(stats(60)), "vit")).toBe("b");
  });
});
