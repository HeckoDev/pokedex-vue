import { ref } from "vue";
import { apiService } from "../services/api";

interface Favorite {
  id: number;
  created_at: string;
  user_id: number;
  pokemon_id: number;
}

const favorites = ref<Favorite[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

export function useFavorites() {
  const fetchFavorites = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiService.getFavorites();
      favorites.value = data;
      return { success: true };
    } catch (err: any) {
      error.value =
        err.response?.data?.error ||
        "Erreur lors de la récupération des favoris";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const addFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const favorite = await apiService.addFavorite(pokemonId);
      favorites.value.push(favorite);
      return { success: true, data: favorite };
    } catch (err: any) {
      error.value =
        err.response?.data?.error || "Erreur lors de l'ajout du favori";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removeFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      // Trouver le favori correspondant au pokemonId
      const favorite = favorites.value.find((f) => f.pokemon_id === pokemonId);
      if (!favorite) {
        throw new Error("Favori non trouvé");
      }

      await apiService.removeFavorite(favorite.id);
      favorites.value = favorites.value.filter((f) => f.id !== favorite.id);
      return { success: true };
    } catch (err: any) {
      error.value =
        err.response?.data?.error || "Erreur lors de la suppression du favori";
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
