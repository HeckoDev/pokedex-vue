import { describe, it, expect, beforeEach, vi } from "vitest";

const res = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
});

const makeFavorite = (pokemonId: number, id = pokemonId) => ({
  id,
  created_at: "2024-01-01T00:00:00Z",
  user_id: 1,
  pokemon_id: pokemonId,
});

let useFavorites: any;
let fetchMock: ReturnType<typeof vi.fn>;

describe("useFavorites Composable - API integration", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("token", "jwt-token");
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const module = await import("../useFavorites");
    useFavorites = module.useFavorites;
  });

  describe("Initial state", () => {
    it("starts empty", () => {
      const { favorites, loading, error } = useFavorites();
      expect(favorites.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe("fetchFavorites", () => {
    it("GETs /favorites and stores the result", async () => {
      const data = [makeFavorite(25), makeFavorite(1)];
      fetchMock.mockResolvedValueOnce(res(data));
      const { fetchFavorites, favorites } = useFavorites();

      const result = await fetchFavorites();

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/favorites");
      expect(options.headers.Authorization).toBe("Bearer jwt-token");
      expect(favorites.value).toEqual(data);
    });

    it("sets an error message on failure", async () => {
      fetchMock.mockResolvedValueOnce(res({ error: "boom" }, false, 500));
      const { fetchFavorites, error } = useFavorites();
      const result = await fetchFavorites();
      expect(result.success).toBe(false);
      expect(error.value).toBe("boom");
    });
  });

  describe("addFavorite", () => {
    it("POSTs the pokemon_id and appends the favorite", async () => {
      const created = makeFavorite(150, 99);
      fetchMock.mockResolvedValueOnce(res(created, true, 201));
      const { addFavorite, favorites, isFavorite } = useFavorites();

      const result = await addFavorite(150);

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/favorites");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ pokemon_id: 150 });
      expect(favorites.value).toContainEqual(created);
      expect(isFavorite(150)).toBe(true);
    });

    it("returns an error when the API rejects (already favorite)", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Pokemon already in favorites" }, false, 409)
      );
      const { addFavorite, favorites } = useFavorites();
      const result = await addFavorite(25);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Pokemon already in favorites");
      expect(favorites.value).toEqual([]);
    });
  });

  describe("removeFavorite", () => {
    it("DELETEs by pokemon_id and removes it from state", async () => {
      // seed state
      fetchMock.mockResolvedValueOnce(res([makeFavorite(25), makeFavorite(7)]));
      const { fetchFavorites, removeFavorite, favorites } = useFavorites();
      await fetchFavorites();
      expect(favorites.value).toHaveLength(2);

      fetchMock.mockResolvedValueOnce(res(null, true, 204));
      const result = await removeFavorite(25);

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[1];
      expect(url).toContain("/api/favorites/25");
      expect(options.method).toBe("DELETE");
      expect(favorites.value.map((f: any) => f.pokemon_id)).toEqual([7]);
    });
  });

  describe("toggleFavorite", () => {
    it("adds when absent", async () => {
      fetchMock.mockResolvedValueOnce(res(makeFavorite(4), true, 201));
      const { toggleFavorite, isFavorite } = useFavorites();
      await toggleFavorite(4);
      expect(isFavorite(4)).toBe(true);
    });

    it("removes when present", async () => {
      fetchMock.mockResolvedValueOnce(res([makeFavorite(4)]));
      const { fetchFavorites, toggleFavorite, isFavorite } = useFavorites();
      await fetchFavorites();
      expect(isFavorite(4)).toBe(true);

      fetchMock.mockResolvedValueOnce(res(null, true, 204));
      await toggleFavorite(4);
      expect(isFavorite(4)).toBe(false);
    });
  });

  describe("clearFavorites", () => {
    it("empties the local list", async () => {
      fetchMock.mockResolvedValueOnce(res([makeFavorite(1)]));
      const { fetchFavorites, clearFavorites, favorites } = useFavorites();
      await fetchFavorites();
      expect(favorites.value).toHaveLength(1);
      clearFavorites();
      expect(favorites.value).toEqual([]);
    });
  });
});
