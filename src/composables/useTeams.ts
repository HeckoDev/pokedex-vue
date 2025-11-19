import { ref } from "vue";
import { apiService } from "../services/api";

interface TeamPokemon {
  id: number;
  created_at: string;
  team_id: number;
  pokemon_id: number;
  position: number;
  nickname: string;
  is_shiny: boolean;
}

interface Team {
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
      const data = await apiService.getTeams();
      teams.value = data;
      return { success: true };
    } catch (err: any) {
      error.value =
        err.response?.data?.error ||
        "Erreur lors de la récupération des équipes";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const fetchTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiService.getTeam(teamId);
      currentTeam.value = data;
      return { success: true, data };
    } catch (err: any) {
      error.value =
        err.response?.data?.error ||
        "Erreur lors de la récupération de l'équipe";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const createTeam = async (name: string) => {
    loading.value = true;
    error.value = null;
    try {
      const team = await apiService.createTeam(name);
      teams.value.push(team);
      return { success: true, data: team };
    } catch (err: any) {
      error.value =
        err.response?.data?.error || "Erreur lors de la création de l'équipe";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const deleteTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteTeam(teamId);
      teams.value = teams.value.filter((t) => t.id !== teamId);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = null;
      }
      return { success: true };
    } catch (err: any) {
      error.value =
        err.response?.data?.error ||
        "Erreur lors de la suppression de l'équipe";
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
      const pokemon = await apiService.addPokemonToTeam(
        teamId,
        pokemonId,
        position,
        nickname,
        isShiny
      );

      // Mettre à jour l'équipe actuelle si c'est la bonne
      if (currentTeam.value?.id === teamId) {
        if (!currentTeam.value.pokemons) {
          currentTeam.value.pokemons = [];
        }
        currentTeam.value.pokemons.push(pokemon);
      }

      // Mettre à jour la liste des équipes
      const teamIndex = teams.value.findIndex((t) => t.id === teamId);
      if (teamIndex !== -1) {
        if (!teams.value[teamIndex].pokemons) {
          teams.value[teamIndex].pokemons = [];
        }
        teams.value[teamIndex].pokemons!.push(pokemon);
      }

      return { success: true, data: pokemon };
    } catch (err: any) {
      error.value =
        err.response?.data?.error || "Erreur lors de l'ajout du Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removePokemonFromTeam = async (teamId: number, pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.removePokemonFromTeam(teamId, pokemonId);

      // Mettre à jour l'équipe actuelle
      if (currentTeam.value?.id === teamId && currentTeam.value.pokemons) {
        currentTeam.value.pokemons = currentTeam.value.pokemons.filter(
          (p) => p.id !== pokemonId
        );
      }

      // Mettre à jour la liste des équipes
      const teamIndex = teams.value.findIndex((t) => t.id === teamId);
      if (teamIndex !== -1 && teams.value[teamIndex].pokemons) {
        teams.value[teamIndex].pokemons = teams.value[
          teamIndex
        ].pokemons!.filter((p) => p.id !== pokemonId);
      }

      return { success: true };
    } catch (err: any) {
      error.value =
        err.response?.data?.error || "Erreur lors de la suppression du Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const canAddPokemon = (teamId: number) => {
    const team = teams.value.find((t) => t.id === teamId);
    if (!team || !team.pokemons) return true;
    return team.pokemons.length < 6;
  };

  const canCreateTeam = () => {
    return teams.value.length < 3;
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
  };
}
