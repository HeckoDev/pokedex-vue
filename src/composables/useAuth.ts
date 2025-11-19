import { ref, computed } from "vue";
import { apiService } from "../services/api";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

const token = ref<string | null>(localStorage.getItem("token"));
const user = ref<User | null>(
  localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null
);

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await apiService.register(username, email, password);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Erreur lors de l'inscription",
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Erreur lors de la connexion",
      };
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const getProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      user.value = profile;
      localStorage.setItem("user", JSON.stringify(profile));
      return { success: true, data: profile };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Erreur lors de la récupération du profil",
      };
    }
  };

  return {
    token,
    user,
    isAuthenticated,
    register,
    login,
    logout,
    getProfile,
  };
}
