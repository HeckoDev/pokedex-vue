import { ref } from "vue";
import { api, ApiError } from "../services/api";

export interface Favorite {
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
      const data = await api.get<Favorite[]>("/favorites", true);
      favorites.value = data ?? [];
      return { success: true };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error retrieving favorites";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const addFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const favorite = await api.post<Favorite>(
        "/favorites",
        { pokemon_id: pokemonId },
        true
      );
      favorites.value.push(favorite);
      return { success: true, data: favorite };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error adding favorite";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const removeFavorite = async (pokemonId: number) => {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/favorites/${pokemonId}`, undefined, true);
      favorites.value = favorites.value.filter(
        (f) => f.pokemon_id !== pokemonId
      );
      return { success: true };
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : "Error removing favorite";
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
    }
    return await addFavorite(pokemonId);
  };

  const clearFavorites = () => {
    favorites.value = [];
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
    clearFavorites,
  };
}
