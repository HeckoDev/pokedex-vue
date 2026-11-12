import { describe, it, expect } from "vitest";
import type { Pokemon } from "@/types/pokemon";
import {
  emptyExtraFilters,
  countExtraFilters,
  getEvolutionStage,
  getFormDisplay,
  matchesExtraFilters,
} from "../pokemonFilters";

const step = { name: "x" } as never;

const make = (over: Partial<Pokemon> & { pokedex_id: number }): Pokemon =>
  ({
    sprites: { regular: "", shiny: null, gmax: null },
    formes: null,
    evolution: null,
    ...over,
  }) as Pokemon;

describe("getEvolutionStage", () => {
  it("classifies base, middle, final and single", () => {
    expect(getEvolutionStage(make({ pokedex_id: 1, evolution: { pre: null, next: [step], mega: null } }))).toBe("basic");
    expect(getEvolutionStage(make({ pokedex_id: 2, evolution: { pre: [step], next: [step], mega: null } }))).toBe("middle");
    expect(getEvolutionStage(make({ pokedex_id: 3, evolution: { pre: [step], next: null, mega: null } }))).toBe("final");
    expect(getEvolutionStage(make({ pokedex_id: 150 }))).toBe("single");
  });
});

describe("matchesExtraFilters", () => {
  it("matches everything when no filter is set", () => {
    expect(matchesExtraFilters(make({ pokedex_id: 25 }), emptyExtraFilters())).toBe(true);
  });

  it("detects mega via the generated list", () => {
    const f = { ...emptyExtraFilters(), forms: ["mega" as const] };
    expect(matchesExtraFilters(make({ pokedex_id: 6 }), f)).toBe(true);
    expect(matchesExtraFilters(make({ pokedex_id: 25 }), f)).toBe(false);
  });

  it("detects gigamax and regional forms", () => {
    const gmax = make({ pokedex_id: 25, sprites: { regular: "", shiny: null, gmax: { regular: "g", shiny: null } } });
    const alola = make({ pokedex_id: 19, formes: [{ region: "alola", name: { fr: "", en: "", jp: "" } }] });
    expect(matchesExtraFilters(gmax, { ...emptyExtraFilters(), forms: ["gmax"] })).toBe(true);
    expect(matchesExtraFilters(alola, { ...emptyExtraFilters(), forms: ["gmax"] })).toBe(false);
    expect(matchesExtraFilters(alola, { ...emptyExtraFilters(), forms: ["alola"] })).toBe(true);
    expect(matchesExtraFilters(alola, { ...emptyExtraFilters(), forms: ["galar"] })).toBe(false);
  });

  it("ORs within a group and ANDs between groups", () => {
    const mewtwo = make({ pokedex_id: 150 });
    const both = { ...emptyExtraFilters(), rarities: ["legendary" as const, "mythical" as const], stages: ["single" as const] };
    expect(matchesExtraFilters(mewtwo, both)).toBe(true);
    expect(matchesExtraFilters(mewtwo, { ...both, stages: ["final" as const] })).toBe(false);
    expect(matchesExtraFilters(make({ pokedex_id: 151 }), { ...emptyExtraFilters(), rarities: ["mythical"] })).toBe(true);
  });

  it("counts active criteria", () => {
    expect(countExtraFilters({ forms: ["mega"], rarities: [], stages: ["basic", "final"] })).toBe(3);
  });
});

describe("getFormDisplay", () => {
  const sprites = { regular: "r", shiny: "s" };
  const rattata = make({ pokedex_id: 19 });
  const charizard = make({
    pokedex_id: 6,
    evolution: { pre: null, next: null, mega: [{ orbe: "x", sprites }] as never },
    sprites: { regular: "n", shiny: null, gmax: { regular: "gr", shiny: "gs" } },
  });

  it("returns null without a matching form", () => {
    expect(getFormDisplay(charizard, [], false)).toBeNull();
    expect(getFormDisplay(make({ pokedex_id: 25 }), ["mega"], false)).toBeNull();
  });

  it("uses the mega or gigamax sprite, shiny when asked", () => {
    expect(getFormDisplay(charizard, ["mega"], false)?.sprite).toBe("r");
    expect(getFormDisplay(charizard, ["mega"], true)?.sprite).toBe("s");
    expect(getFormDisplay(charizard, ["gmax"], true)?.sprite).toBe("gs");
  });

  it("falls back to the PokeAPI artwork for a Mega missing from the local data", () => {
    const meganium = make({ pokedex_id: 154 });
    expect(getFormDisplay(meganium, ["mega"], false)?.sprite).toMatch(/official-artwork\/\d+\.png$/);
  });

  it("follows the filter order when several forms are selected", () => {
    expect(getFormDisplay(charizard, ["gmax", "mega"], false)?.form).toBe("mega");
  });

  it("builds the regional artwork URL from the generated form id", () => {
    expect(getFormDisplay(rattata, ["alola"], false)?.sprite).toMatch(/official-artwork\/10091\.png$/);
    expect(getFormDisplay(rattata, ["alola"], true)?.sprite).toMatch(/shiny\/10091\.png$/);
    expect(getFormDisplay(rattata, ["galar"], false)).toBeNull();
  });
});
