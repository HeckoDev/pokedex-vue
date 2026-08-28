import { ref, computed } from "vue";
import { sanitizeInput } from "../utils/security";
import { validateEmail, validatePassword, validateUsername } from "../utils/validation";
import { safeParseJSON } from "../utils/storage";
import { api, ApiError } from "../services/api";

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
const user = ref<User | null>(safeParseJSON(localStorage.getItem(USER_KEY), null));

const persistSession = (authResponse: AuthResponse) => {
  token.value = authResponse.token;
  user.value = authResponse.user;
  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
};

const clearSession = () => {
  token.value = null;
  user.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    // Client-side validation before hitting the API
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

    try {
      await api.post<{ message?: string }>("/register", {
        username: sanitizeInput(username),
        email: email.toLowerCase().trim(),
        password,
      });
      return { success: true, needsVerification: true, email: email.toLowerCase().trim() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Registration error",
      };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const data = await api.post<AuthResponse>("/verify-email", {
        email: email.toLowerCase().trim(),
        code: code.trim(),
      });
      persistSession(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Verification error",
      };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await api.post<{ message?: string }>("/resend-verification", {
        email: email.toLowerCase().trim(),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Unable to resend code",
      };
    }
  };

  const login = async (email: string, password: string) => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, error: emailValidation.error };
    }

    try {
      const data = await api.post<AuthResponse>("/login", {
        email: email.toLowerCase().trim(),
        password,
      });
      persistSession(data);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        return {
          success: false,
          needsVerification: true,
          email: email.toLowerCase().trim(),
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Login error",
      };
    }
  };

  const logout = () => {
    clearSession();
  };

  const getProfile = async () => {
    try {
      const data = await api.get<User>("/profile", true);
      user.value = data;
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
      }
      return {
        success: false,
        error:
          error instanceof ApiError ? error.message : "Error retrieving profile",
      };
    }
  };

  const updateProfile = async (username: string) => {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return { success: false, error: usernameValidation.error };
    }

    try {
      const data = await api.put<User>(
        "/profile",
        { username: sanitizeInput(username) },
        true
      );
      user.value = data;
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
      }
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Update error",
      };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    try {
      await api.put<{ message?: string }>(
        "/password",
        { current_password: currentPassword, new_password: newPassword },
        true
      );
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // 401 here means wrong current password (endpoint is authenticated),
        // so surface the server message rather than logging the user out.
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Update error",
      };
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      await api.delete<{ message?: string }>("/account", { password }, true);
      clearSession();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error.message : "Deletion error",
      };
    }
  };

  return {
    token,
    user,
    isAuthenticated,
    register,
    verifyEmail,
    resendVerification,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
  };
}
