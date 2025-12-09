import { ref, onMounted, onUnmounted } from "vue";
import { safeParseJSON, safeSetItem } from "../utils/storage";
import { sanitizeInput } from "../utils/security";

// Constantes de configuration
const MAX_POKEMON_PER_TEAM = 6;
const MAX_TEAMS_PER_USER = 3;

interface UserData {
  id: number;
  username: string;
  email: string;
}

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

// Charger les équipes depuis le localStorage
const loadTeamsFromStorage = () => {
  const user = localStorage.getItem("user");
  if (user) {
    const userData = safeParseJSON<UserData | null>(user, null);
    if (userData) {
      const userId = userData.id;
      const storedTeams = localStorage.getItem(`teams_${userId}`);
      teams.value = safeParseJSON<Team[]>(storedTeams, []);
    } else {
      teams.value = [];
    }
  } else {
    teams.value = [];
  }
};

// Sauvegarder les équipes dans le localStorage
const saveTeamsToStorage = () => {
  const user = localStorage.getItem("user");
  if (user) {
    const userData = safeParseJSON<UserData | null>(user, null);
    if (userData) {
      const userId = userData.id;
      const success = safeSetItem(`teams_${userId}`, JSON.stringify(teams.value));
      if (!success) {
        error.value = "Impossible de sauvegarder les équipes";
      }
    }
  }
};

// Charger les équipes au démarrage
loadTeamsFromStorage();

export function useTeams() {
  // Écouter les changements de localStorage depuis d'autres onglets
  const handleStorageChange = (event: StorageEvent) => {
    const user = localStorage.getItem("user");
    if (!user) return;
    
    const userData = safeParseJSON<UserData | null>(user, null);
    if (!userData) return;
    
    const userId = userData.id;
    const key = `teams_${userId}`;
    
    if (event.key === key && event.newValue) {
      teams.value = safeParseJSON<Team[]>(event.newValue, []);
    }
  };

  onMounted(() => {
    window.addEventListener('storage', handleStorageChange);
  });

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
  });

  const fetchTeams = async () => {
    loading.value = true;
    error.value = null;
    try {
      loadTeamsFromStorage();
      return { success: true };
    } catch (err: any) {
      error.value = "Erreur lors de la récupération des équipes";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const fetchTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const team = teams.value.find((t) => t.id === teamId);
      if (!team) {
        throw new Error("Équipe non trouvée");
      }
      currentTeam.value = team;
      return { success: true, data: team };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de la récupération de l'équipe";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const createTeam = async (name: string) => {
    loading.value = true;
    error.value = null;
    try {
      const user = localStorage.getItem("user");
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      const userData = safeParseJSON<UserData | null>(user, null);
      if (!userData) {
        throw new Error("Utilisateur non connecté");
      }

      const userId = userData.id;
      const team: Team = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId,
        name: sanitizeInput(name),
        pokemons: [],
      };

      teams.value.push(team);
      saveTeamsToStorage();
      return { success: true, data: team };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de la création de l'équipe";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const deleteTeam = async (teamId: number) => {
    loading.value = true;
    error.value = null;
    try {
      teams.value = teams.value.filter((t) => t.id !== teamId);
      if (currentTeam.value?.id === teamId) {
        currentTeam.value = null;
      }
      saveTeamsToStorage();
      return { success: true };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de la suppression de l'équipe";
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
      const pokemon: TeamPokemon = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        team_id: teamId,
        pokemon_id: pokemonId,
        position,
        nickname: nickname ? sanitizeInput(nickname) : "",
        is_shiny: isShiny || false,
      };

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

      saveTeamsToStorage();
      return { success: true, data: pokemon };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de l'ajout du Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removePokemonFromTeam = async (teamId: number, pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
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

      saveTeamsToStorage();
      return { success: true };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de la suppression du Pokémon";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const canAddPokemon = (teamId: number) => {
    const team = teams.value.find((t) => t.id === teamId);
    if (!team || !team.pokemons) return false;
    return team.pokemons.length < MAX_POKEMON_PER_TEAM;
  };

  const canCreateTeam = () => {
    return teams.value.length < MAX_TEAMS_PER_USER;
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
