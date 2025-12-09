import { ref, computed } from "vue";
import { hashPassword, generateSalt, sanitizeInput } from "../utils/security";
import { validateEmail, validatePassword, validateUsername } from "../utils/validation";
import { safeParseJSON } from "../utils/storage";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface StoredUser extends User {
  password: string;
  salt: string;
}

const token = ref<string | null>(localStorage.getItem("token"));
const user = ref<User | null>(
  safeParseJSON(localStorage.getItem("user"), null)
);

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      // Validation des entrées
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return { success: false, error: usernameValidation.error };
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
      }

      // Vérifier si l'email existe déjà
      const users: StoredUser[] = safeParseJSON(localStorage.getItem("users"), []);
      if (users.some((u: StoredUser) => u.email.toLowerCase() === email.toLowerCase())) {
        return {
          success: false,
          error: "Cet email est déjà utilisé",
        };
      }

      // Générer le salt et hasher le mot de passe
      const salt = generateSalt();
      const hashedPassword = await hashPassword(password, salt);

      // Créer un nouvel utilisateur avec sanitization
      const newUser: User = {
        id: Date.now(),
        username: sanitizeInput(username),
        email: email.toLowerCase().trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Sauvegarder l'utilisateur avec mot de passe hashé
      const storedUser: StoredUser = { ...newUser, password: hashedPassword, salt };
      users.push(storedUser);
      localStorage.setItem("users", JSON.stringify(users));

      // Connecter l'utilisateur
      const newToken = `token_${Date.now()}`;
      token.value = newToken;
      user.value = newUser;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de l'inscription",
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Validation de base
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // Vérifier les identifiants
      const users: StoredUser[] = safeParseJSON(localStorage.getItem("users"), []);
      const foundUser = users.find(
        (u: StoredUser) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!foundUser) {
        return {
          success: false,
          error: "Email ou mot de passe incorrect",
        };
      }

      // Vérifier le mot de passe hashé
      const hashedInput = await hashPassword(password, foundUser.salt);
      if (hashedInput !== foundUser.password) {
        return {
          success: false,
          error: "Email ou mot de passe incorrect",
        };
      }

      // Connecter l'utilisateur
      const { password: _, salt: __, ...userWithoutPassword } = foundUser;
      const newToken = `token_${Date.now()}`;
      token.value = newToken;
      user.value = userWithoutPassword;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de la connexion",
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
      if (user.value) {
        return { success: true, data: user.value };
      }
      return {
        success: false,
        error: "Utilisateur non connecté",
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Erreur lors de la récupération du profil",
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
