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
      // Input validation
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

      // Check if email already exists
      const users: StoredUser[] = safeParseJSON(localStorage.getItem("users"), []);
      if (users.some((u: StoredUser) => u.email.toLowerCase() === email.toLowerCase())) {
        return {
          success: false,
          error: "This email is already in use",
        };
      }

      // Generate salt and hash password
      const salt = generateSalt();
      const hashedPassword = await hashPassword(password, salt);

      // Create a new user with sanitization
      const newUser: User = {
        id: Date.now(),
        username: sanitizeInput(username),
        email: email.toLowerCase().trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save user with hashed password
      const storedUser: StoredUser = { ...newUser, password: hashedPassword, salt };
      users.push(storedUser);
      localStorage.setItem("users", JSON.stringify(users));

      // Log in the user
      const newToken = `token_${Date.now()}`;
      token.value = newToken;
      user.value = newUser;
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Registration error",
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Basic validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // Check credentials
      const users: StoredUser[] = safeParseJSON(localStorage.getItem("users"), []);
      const foundUser = users.find(
        (u: StoredUser) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!foundUser) {
        return {
          success: false,
          error: "Incorrect email or password",
        };
      }

      // Verify hashed password
      const hashedInput = await hashPassword(password, foundUser.salt);
      if (hashedInput !== foundUser.password) {
        return {
          success: false,
          error: "Incorrect email or password",
        };
      }

      // Log in the user
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
        error: error.message || "Login error",
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
        error: "User not logged in",
      };
    } catch (error: any) {
      return {
        success: false,
        error: "Error retrieving profile",
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
