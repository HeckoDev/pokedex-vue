import { ref } from "vue";
import { sanitizeInput } from "../utils/security";
import { api, ApiError } from "../services/api";

// Configuration constants (mirror the server-side limits)
const MAX_POKEMON_PER_TEAM = 6;
const MAX_TEAMS_PER_USER = 3;

export interface TeamPokemon {
  id: number;
  created_at: string;
  team_id: number;
  pokemon_id: number;
  position: number;
  nickname: string;
  is_shiny: boolean;
}

export interface Team {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  name: string;
  pokemons?: TeamPokemon[];
}

const teams = ref<Team[]>([]);
const currentTeam = ref<Team | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

export function useTeams() {
  const fetchTeams = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<Team[]>("/teams", true);
      teams.value = data ?? [];
      return { success: true };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error retrieving teams";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const fetchTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<Team>(`/teams/${teamId}`, true);
      currentTeam.value = data;
      return { success: true, data };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error retrieving team";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const createTeam = async (name: string) => {
    loading.value = true;
    error.value = null;
    try {
      const team = await api.post<Team>(
        "/teams",
        { name: sanitizeInput(name) },
        true
      );
      if (!team.pokemons) team.pokemons = [];
      teams.value.push(team);
      return { success: true, data: team };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error creating team";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const deleteTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/teams/${teamId}`, undefined, true);
      teams.value = teams.value.filter((t) => t.id !== teamId);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = null;
      }
      return { success: true };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error deleting team";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const addPokemonToTeam = async (
    teamId: number,
    pokemonId: number,
    position: number,
    nickname?: string,
    isShiny?: boolean
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const pokemon = await api.post<TeamPokemon>(
        `/teams/${teamId}/pokemons`,
        {
          pokemon_id: pokemonId,
          position,
          nickname: nickname ? sanitizeInput(nickname) : "",
          is_shiny: isShiny || false,
        },
        true
      );

      const team = teams.value.find((t) => t.id === teamId);
      if (team) {
        if (!team.pokemons) team.pokemons = [];
        team.pokemons.push(pokemon);
      }
      if (currentTeam.value?.id === teamId) {
        if (!currentTeam.value.pokemons) currentTeam.value.pokemons = [];
        currentTeam.value.pokemons.push(pokemon);
      }

      return { success: true, data: pokemon };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error adding Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removePokemonFromTeam = async (
    teamId: number,
    teamPokemonId: number
  ) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/teams/${teamId}/pokemons/${teamPokemonId}`, undefined, true);

      const team = teams.value.find((t) => t.id === teamId);
      if (team?.pokemons) {
        team.pokemons = team.pokemons.filter((p) => p.id !== teamPokemonId);
      }
      if (currentTeam.value?.id === teamId && currentTeam.value.pokemons) {
        currentTeam.value.pokemons = currentTeam.value.pokemons.filter(
          (p) => p.id !== teamPokemonId
        );
      }

      return { success: true };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error removing Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const canAddPokemon = (teamId: number) => {
    const team = teams.value.find((t) => t.id === teamId);
    if (!team) return false;
    return (team.pokemons?.length ?? 0) < MAX_POKEMON_PER_TEAM;
  };

  const canCreateTeam = () => {
    return teams.value.length < MAX_TEAMS_PER_USER;
  };

  const clearTeams = () => {
    teams.value = [];
    currentTeam.value = null;
  };

  return {
    teams,
    currentTeam,
    loading,
    error,
    fetchTeams,
    fetchTeam,
    createTeam,
    deleteTeam,
    addPokemonToTeam,
    removePokemonFromTeam,
    canAddPokemon,
    canCreateTeam,
    clearTeams,
  };
}
