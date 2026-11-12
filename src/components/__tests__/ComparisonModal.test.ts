import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ComparisonModal from "../ComparisonModal.vue";
import type { Pokemon } from "@/types/pokemon";

const stats = (n: number) => ({ hp: n, atk: n, def: n, spe_atk: n, spe_def: n, vit: n });
const mon = (id: number, name: string, n: number, height: string): Pokemon =>
  ({
    pokedex_id: id,
    name: { fr: name, en: name, jp: name },
    sprites: { regular: "r.png", shiny: "s.png", gmax: null },
    types: [{ name: "Feu", image: "" }],
    talents: [{ name: "Brasier", tc: false }, { name: "Force Soleil", tc: true }],
    stats: stats(n),
    height,
    weight: "10 kg",
  }) as Pokemon;

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(ComparisonModal, {
    props: {
      isOpen: true,
      language: "fr",
      isShiny: false,
      pokemons: [mon(6, "Dracaufeu", 80, "1.7 m"), mon(150, "Mewtwo", 100, "2.0 m")],
      ...props,
    },
    global: { stubs: { Teleport: true, Transition: false } },
  });

describe("ComparisonModal", () => {
  it("renders nothing without exactly two Pokémon", () => {
    const wrapper = mountModal({ pokemons: [mon(6, "Dracaufeu", 80, "1.7 m")] });
    expect(wrapper.find('[data-testid="comparison-modal"]').exists()).toBe(false);
  });

  it("marks the higher value of each stat and of the total", () => {
    const wrapper = mountModal();
    const hp = wrapper.findAll('[data-testid="compare-row-hp"] td');
    expect(hp[0].attributes("data-winner")).toBe("false");
    expect(hp[1].attributes("data-winner")).toBe("true");
    const total = wrapper.findAll('[data-testid="compare-row-total"] td');
    expect(total[1].text()).toContain("600");
    expect(total[1].attributes("data-winner")).toBe("true");
  });

  it("flags neither side on a tie", () => {
    const wrapper = mountModal({ pokemons: [mon(1, "A", 70, "1 m"), mon(2, "B", 70, "1 m")] });
    const cells = wrapper.findAll('[data-testid="compare-row-hp"] td');
    expect(cells.map((c) => c.attributes("data-winner"))).toEqual(["false", "false"]);
  });

  it("lists abilities with the hidden marker and emits close", async () => {
    const wrapper = mountModal();
    expect(wrapper.text()).toContain("Force Soleil");
    await wrapper.find('button[aria-label]').trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
