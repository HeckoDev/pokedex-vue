import { ref, onMounted, onUnmounted } from "vue";
import { safeParseJSON, safeSetItem } from "../utils/storage";

interface Favorite {
  id: number;
  created_at: string;
  user_id: number;
  pokemon_id: number;
}

const favorites = ref<Favorite[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

interface UserData {
  id: number;
  username: string;
  email: string;
}

// Charger les favoris depuis le localStorage au démarrage
const loadFavoritesFromStorage = () => {
  const user = localStorage.getItem("user");
  if (user) {
    const userData = safeParseJSON<UserData | null>(user, null);
    if (userData) {
      const userId = userData.id;
      const storedFavorites = localStorage.getItem(`favorites_${userId}`);
      favorites.value = safeParseJSON<Favorite[]>(storedFavorites, []);
    } else {
      favorites.value = [];
    }
  } else {
    favorites.value = [];
  }
};

// Sauvegarder les favoris dans le localStorage
const saveFavoritesToStorage = () => {
  const user = localStorage.getItem("user");
  if (user) {
    const userData = safeParseJSON<UserData | null>(user, null);
    if (userData) {
      const userId = userData.id;
      const success = safeSetItem(`favorites_${userId}`, JSON.stringify(favorites.value));
      if (!success) {
        error.value = "Impossible de sauvegarder les favoris";
      }
    }
  }
};

// Charger les favoris au démarrage
loadFavoritesFromStorage();

export function useFavorites() {
  // Écouter les changements de localStorage depuis d'autres onglets
  const handleStorageChange = (event: StorageEvent) => {
    const user = localStorage.getItem("user");
    if (!user) return;
    
    const userData = safeParseJSON<UserData | null>(user, null);
    if (!userData) return;
    
    const userId = userData.id;
    const key = `favorites_${userId}`;
    
    if (event.key === key && event.newValue) {
      favorites.value = safeParseJSON<Favorite[]>(event.newValue, []);
    }
  };

  onMounted(() => {
    window.addEventListener('storage', handleStorageChange);
  });

  onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
  });
  const fetchFavorites = async () => {
    loading.value = true;
    error.value = null;
    try {
      loadFavoritesFromStorage();
      return { success: true };
    } catch (err: any) {
      error.value = "Erreur lors de la récupération des favoris";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const addFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const user = localStorage.getItem("user");
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      const userId = JSON.parse(user).id;
      const favorite: Favorite = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        user_id: userId,
        pokemon_id: pokemonId,
      };

      favorites.value.push(favorite);
      saveFavoritesToStorage();
      return { success: true, data: favorite };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de l'ajout du favori";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removeFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const favorite = favorites.value.find((f) => f.pokemon_id === pokemonId);
      if (!favorite) {
        throw new Error("Favori non trouvé");
      }

      favorites.value = favorites.value.filter((f) => f.id !== favorite.id);
      saveFavoritesToStorage();
      return { success: true };
    } catch (err: any) {
      error.value = err.message || "Erreur lors de la suppression du favori";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const isFavorite = (pokemonId: number) => {
    return favorites.value.some((f) => f.pokemon_id === pokemonId);
  };

  const toggleFavorite = async (pokemonId: number) => {
    if (isFavorite(pokemonId)) {
      return await removeFavorite(pokemonId);
    } else {
      return await addFavorite(pokemonId);
    }
  };

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
