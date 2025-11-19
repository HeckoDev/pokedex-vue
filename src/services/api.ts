import axios, { type AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercepteur pour ajouter le token JWT
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs d'authentification
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(username: string, email: string, password: string) {
    const response = await this.api.post("/api/register", {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post("/api/login", {
      email,
      password,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.api.get("/api/profile");
    return response.data;
  }

  // Favorites
  async getFavorites() {
    const response = await this.api.get("/api/favorites");
    return response.data;
  }

  async addFavorite(pokemonId: number) {
    const response = await this.api.post("/api/favorites", {
      pokemon_id: pokemonId,
    });
    return response.data;
  }

  async removeFavorite(favoriteId: number) {
    await this.api.delete(`/api/favorites/${favoriteId}`);
  }

  // Teams
  async getTeams() {
    const response = await this.api.get("/api/teams");
    return response.data;
  }

  async getTeam(teamId: number) {
    const response = await this.api.get(`/api/teams/${teamId}`);
    return response.data;
  }

  async createTeam(name: string) {
    const response = await this.api.post("/api/teams", { name });
    return response.data;
  }

  async deleteTeam(teamId: number) {
    await this.api.delete(`/api/teams/${teamId}`);
  }

  async addPokemonToTeam(
    teamId: number,
    pokemonId: number,
    position: number,
    nickname?: string,
    isShiny?: boolean
  ) {
    const response = await this.api.post(`/api/teams/${teamId}/pokemons`, {
      pokemon_id: pokemonId,
      position,
      nickname,
      is_shiny: isShiny || false,
    });
    return response.data;
  }

  async removePokemonFromTeam(teamId: number, pokemonId: number) {
    await this.api.delete(`/api/teams/${teamId}/pokemons/${pokemonId}`);
  }
}

export const apiService = new ApiService();
