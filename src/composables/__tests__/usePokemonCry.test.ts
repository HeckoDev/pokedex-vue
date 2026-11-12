import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePokemonCry } from "../usePokemonCry";
import * as api from "@/services/pokeapi";

vi.mock("@/services/pokeapi", () => ({ fetchPokemonCryUrl: vi.fn() }));

const played: string[] = [];
beforeEach(() => {
  played.length = 0;
  vi.mocked(api.fetchPokemonCryUrl).mockReset();
  vi.stubGlobal(
    "Audio",
    class {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public src: string) {}
      play() {
        played.push(this.src);
        return Promise.resolve();
      }
      pause() {}
    }
  );
});

describe("usePokemonCry", () => {
  it("plays the cry of the requested Pokémon", async () => {
    vi.mocked(api.fetchPokemonCryUrl).mockResolvedValue("a.ogg");
    const { play, isPlaying } = usePokemonCry();
    await play(25);
    expect(played).toEqual(["a.ogg"]);
    expect(isPlaying.value).toBe(true);
  });

  it("falls back to the base Pokémon when the form has no cry", async () => {
    vi.mocked(api.fetchPokemonCryUrl).mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce("base.ogg");
    const { play } = usePokemonCry();
    await play("raichu-alola", 26);
    expect(played).toEqual(["base.ogg"]);
  });

  it("flags a Pokémon without cry and plays nothing", async () => {
    vi.mocked(api.fetchPokemonCryUrl).mockResolvedValue(null);
    const { play, hasCry } = usePokemonCry();
    await play(1);
    expect(hasCry.value).toBe(false);
    expect(played).toEqual([]);
  });

  it("ignores a stale response superseded by a newer request", async () => {
    let release!: (v: string) => void;
    vi.mocked(api.fetchPokemonCryUrl)
      .mockReturnValueOnce(new Promise((r) => (release = r)))
      .mockResolvedValueOnce("new.ogg");
    const { play } = usePokemonCry();
    const slow = play(1);
    await play(2);
    release("old.ogg");
    await slow;
    expect(played).toEqual(["new.ogg"]);
  });

  it("does not stay in playing state when the browser refuses autoplay", async () => {
    vi.mocked(api.fetchPokemonCryUrl).mockResolvedValue("a.ogg");
    vi.stubGlobal(
      "Audio",
      class {
        play() {
          return Promise.reject(new DOMException("blocked", "NotAllowedError"));
        }
        pause() {}
      }
    );
    const { play, isPlaying } = usePokemonCry();
    await play(1);
    expect(isPlaying.value).toBe(false);
  });
});
