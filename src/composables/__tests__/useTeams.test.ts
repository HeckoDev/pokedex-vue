import { describe, it, expect, beforeEach, vi } from "vitest";

const res = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
});

const makeTeam = (id: number, name: string, pokemons: any[] = []) => ({
  id,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: 1,
  name,
  pokemons,
});

const makeTeamPokemon = (id: number, pokemonId: number, position: number) => ({
  id,
  created_at: "2024-01-01T00:00:00Z",
  team_id: 1,
  pokemon_id: pokemonId,
  position,
  nickname: "",
  is_shiny: false,
});

let useTeams: any;
let fetchMock: ReturnType<typeof vi.fn>;

describe("useTeams Composable - API integration", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("token", "jwt-token");
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const module = await import("../useTeams");
    useTeams = module.useTeams;
  });

  describe("Initial state", () => {
    it("starts empty", () => {
      const { teams, currentTeam, loading, error } = useTeams();
      expect(teams.value).toEqual([]);
      expect(currentTeam.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });
  });

  describe("fetchTeams", () => {
    it("GETs /teams with auth and stores them", async () => {
      const data = [makeTeam(1, "Alpha"), makeTeam(2, "Beta")];
      fetchMock.mockResolvedValueOnce(res(data));
      const { fetchTeams, teams } = useTeams();

      const result = await fetchTeams();

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/teams");
      expect(options.headers.Authorization).toBe("Bearer jwt-token");
      expect(teams.value).toEqual(data);
    });
  });

  describe("createTeam", () => {
    it("POSTs the name and appends the team", async () => {
      const created = makeTeam(3, "Gamma");
      fetchMock.mockResolvedValueOnce(res(created, true, 201));
      const { createTeam, teams } = useTeams();

      const result = await createTeam("Gamma");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/teams");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ name: "Gamma" });
      expect(teams.value).toContainEqual(expect.objectContaining({ id: 3 }));
    });

    it("returns an error when the server enforces the 3-team limit", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Maximum 3 teams allowed per user" }, false, 400)
      );
      const { createTeam, teams } = useTeams();
      const result = await createTeam("Delta");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum 3 teams allowed per user");
      expect(teams.value).toEqual([]);
    });
  });

  describe("deleteTeam", () => {
    it("DELETEs the team and removes it from state", async () => {
      fetchMock.mockResolvedValueOnce(res([makeTeam(1, "Alpha")]));
      const { fetchTeams, deleteTeam, teams } = useTeams();
      await fetchTeams();
      expect(teams.value).toHaveLength(1);

      fetchMock.mockResolvedValueOnce(res(null, true, 204));
      const result = await deleteTeam(1);

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[1];
      expect(url).toContain("/api/teams/1");
      expect(options.method).toBe("DELETE");
      expect(teams.value).toEqual([]);
    });
  });

  describe("addPokemonToTeam", () => {
    it("POSTs to /teams/:id/pokemons and updates the team", async () => {
      fetchMock.mockResolvedValueOnce(res([makeTeam(1, "Alpha")]));
      const { fetchTeams, addPokemonToTeam, teams } = useTeams();
      await fetchTeams();

      const added = makeTeamPokemon(10, 25, 1);
      fetchMock.mockResolvedValueOnce(res(added, true, 201));
      const result = await addPokemonToTeam(1, 25, 1);

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[1];
      expect(url).toContain("/api/teams/1/pokemons");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toMatchObject({
        pokemon_id: 25,
        position: 1,
        is_shiny: false,
      });
      expect(teams.value[0].pokemons).toContainEqual(added);
    });

    it("returns an error when the team is full", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Team is full (max 6 Pokemon)" }, false, 400)
      );
      const { addPokemonToTeam } = useTeams();
      const result = await addPokemonToTeam(1, 25, 1);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Team is full (max 6 Pokemon)");
    });
  });

  describe("removePokemonFromTeam", () => {
    it("DELETEs the team-pokemon by its id and updates state", async () => {
      const tp = makeTeamPokemon(10, 25, 1);
      fetchMock.mockResolvedValueOnce(res([makeTeam(1, "Alpha", [tp])]));
      const { fetchTeams, removePokemonFromTeam, teams } = useTeams();
      await fetchTeams();
      expect(teams.value[0].pokemons).toHaveLength(1);

      fetchMock.mockResolvedValueOnce(res(null, true, 204));
      const result = await removePokemonFromTeam(1, 10);

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[1];
      expect(url).toContain("/api/teams/1/pokemons/10");
      expect(options.method).toBe("DELETE");
      expect(teams.value[0].pokemons).toEqual([]);
    });
  });

  describe("limits helpers", () => {
    it("canCreateTeam is false once 3 teams exist", async () => {
      fetchMock.mockResolvedValueOnce(
        res([makeTeam(1, "A"), makeTeam(2, "B"), makeTeam(3, "C")])
      );
      const { fetchTeams, canCreateTeam } = useTeams();
      await fetchTeams();
      expect(canCreateTeam()).toBe(false);
    });

    it("canAddPokemon is false once a team has 6 pokemons", async () => {
      const full = Array.from({ length: 6 }, (_, i) =>
        makeTeamPokemon(i + 1, i + 1, i + 1)
      );
      fetchMock.mockResolvedValueOnce(res([makeTeam(1, "A", full)]));
      const { fetchTeams, canAddPokemon } = useTeams();
      await fetchTeams();
      expect(canAddPokemon(1)).toBe(false);
    });

    it("canAddPokemon is true for a team with space", async () => {
      fetchMock.mockResolvedValueOnce(
        res([makeTeam(1, "A", [makeTeamPokemon(1, 1, 1)])])
      );
      const { fetchTeams, canAddPokemon } = useTeams();
      await fetchTeams();
      expect(canAddPokemon(1)).toBe(true);
    });
  });

  describe("clearTeams", () => {
    it("empties teams and currentTeam", async () => {
      fetchMock.mockResolvedValueOnce(res([makeTeam(1, "A")]));
      const { fetchTeams, clearTeams, teams } = useTeams();
      await fetchTeams();
      expect(teams.value).toHaveLength(1);
      clearTeams();
      expect(teams.value).toEqual([]);
    });
  });
});
