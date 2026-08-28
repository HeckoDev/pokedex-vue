import { describe, it, expect, beforeEach, vi } from "vitest";

// Helper to build a fetch-like Response
const res = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
});

const USER = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

let useAuth: any;
let fetchMock: ReturnType<typeof vi.fn>;

describe("useAuth Composable - API integration", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const module = await import("../useAuth");
    useAuth = module.useAuth;
  });

  describe("Initial state", () => {
    it("initializes with no user and no token", () => {
      const { token, user, isAuthenticated } = useAuth();
      expect(token.value).toBeNull();
      expect(user.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
    });

    it("restores session from localStorage", async () => {
      localStorage.setItem("token", "jwt-123");
      localStorage.setItem("user", JSON.stringify(USER));
      vi.resetModules();
      const module = await import("../useAuth");
      const { token, user, isAuthenticated } = module.useAuth();
      expect(token.value).toBe("jwt-123");
      expect(user.value).toEqual(USER);
      expect(isAuthenticated.value).toBe(true);
    });
  });

  describe("register", () => {
    it("POSTs to /register and requires email verification (no session)", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ message: "Verification code sent" }, true, 201)
      );
      const { register, isAuthenticated, token, user } = useAuth();

      const result = await register("testuser", "test@example.com", "Password1");

      expect(result.success).toBe(true);
      expect(result.needsVerification).toBe(true);
      expect(result.email).toBe("test@example.com");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/register");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toMatchObject({
        username: "testuser",
        email: "test@example.com",
        password: "Password1",
      });
      // No session established until email is verified
      expect(token.value).toBeNull();
      expect(user.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("does not call the API when validation fails", async () => {
      const { register } = useAuth();
      const result = await register("ab", "bad", "weak");
      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("surfaces the server error message (e.g. conflict)", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Email already exists" }, false, 409)
      );
      const { register, isAuthenticated } = useAuth();
      const result = await register("testuser", "test@example.com", "Password1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email already exists");
      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe("verifyEmail", () => {
    it("POSTs to /verify-email and persists the session", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ token: "jwt-verified", user: USER })
      );
      const { verifyEmail, isAuthenticated, token } = useAuth();

      const result = await verifyEmail("test@example.com", "123456");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/verify-email");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toMatchObject({
        email: "test@example.com",
        code: "123456",
      });
      expect(token.value).toBe("jwt-verified");
      expect(isAuthenticated.value).toBe(true);
    });

    it("returns an error on an invalid code", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Invalid or expired code" }, false, 400)
      );
      const { verifyEmail, isAuthenticated } = useAuth();
      const result = await verifyEmail("test@example.com", "000000");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired code");
      expect(isAuthenticated.value).toBe(false);
    });
  });

  describe("resendVerification", () => {
    it("POSTs to /resend-verification", async () => {
      fetchMock.mockResolvedValueOnce(res({ message: "Code sent" }));
      const { resendVerification } = useAuth();
      const result = await resendVerification("test@example.com");
      expect(result.success).toBe(true);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/resend-verification");
    });

    it("surfaces the cooldown error", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Please wait before requesting a new code" }, false, 429)
      );
      const { resendVerification } = useAuth();
      const result = await resendVerification("test@example.com");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Please wait before requesting a new code");
    });
  });

  describe("login", () => {
    it("POSTs to /login and persists the session", async () => {
      fetchMock.mockResolvedValueOnce(res({ token: "jwt-login", user: USER }));
      const { login, isAuthenticated, token } = useAuth();

      const result = await login("test@example.com", "Password1");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/login");
      expect(options.method).toBe("POST");
      expect(token.value).toBe("jwt-login");
      expect(isAuthenticated.value).toBe(true);
    });

    it("returns an error on invalid credentials", async () => {
      fetchMock.mockResolvedValueOnce(
        res({ error: "Invalid credentials" }, false, 401)
      );
      const { login, isAuthenticated } = useAuth();
      const result = await login("test@example.com", "Password1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(isAuthenticated.value).toBe(false);
    });

    it("flags an unverified email (403) as needing verification", async () => {
      fetchMock.mockResolvedValueOnce(
        res(
          { error: "Email not verified", email_verified: false, email: "test@example.com" },
          false,
          403
        )
      );
      const { login, isAuthenticated } = useAuth();
      const result = await login("test@example.com", "Password1");
      expect(result.success).toBe(false);
      expect(result.needsVerification).toBe(true);
      expect(result.email).toBe("test@example.com");
      expect(isAuthenticated.value).toBe(false);
    });

    it("rejects an invalid email without calling the API", async () => {
      const { login } = useAuth();
      const result = await login("not-an-email", "Password1");
      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("clears the token and user", async () => {
      fetchMock.mockResolvedValueOnce(res({ token: "jwt", user: USER }));
      const { login, logout, isAuthenticated } = useAuth();
      await login("test@example.com", "Password1");
      expect(isAuthenticated.value).toBe(true);

      logout();

      expect(isAuthenticated.value).toBe(false);
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("getProfile", () => {
    it("GETs /profile with the auth header", async () => {
      localStorage.setItem("token", "jwt-xyz");
      fetchMock.mockResolvedValueOnce(res(USER));
      const { getProfile, user } = useAuth();

      const result = await getProfile();

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/profile");
      expect(options.headers.Authorization).toBe("Bearer jwt-xyz");
      expect(user.value).toEqual(USER);
    });

    it("clears the session on a 401 response", async () => {
      localStorage.setItem("token", "expired");
      fetchMock.mockResolvedValueOnce(res({ error: "Invalid token" }, false, 401));
      const { getProfile, isAuthenticated } = useAuth();

      const result = await getProfile();

      expect(result.success).toBe(false);
      expect(isAuthenticated.value).toBe(false);
      expect(localStorage.getItem("token")).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("PUTs /profile and updates the stored user", async () => {
      localStorage.setItem("token", "jwt-xyz");
      const updated = { ...USER, username: "newname" };
      fetchMock.mockResolvedValueOnce(res(updated));
      const { updateProfile, user } = useAuth();

      const result = await updateProfile("newname");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/profile");
      expect(options.method).toBe("PUT");
      expect(options.headers.Authorization).toBe("Bearer " + "jwt-xyz");
      expect(user.value).toEqual(updated);
      expect(JSON.parse(localStorage.getItem("user")!).username).toBe("newname");
    });

    it("rejects an invalid username without calling the API", async () => {
      const { updateProfile } = useAuth();
      const result = await updateProfile("a");
      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("PUTs /password with current and new passwords", async () => {
      localStorage.setItem("token", "jwt-xyz");
      fetchMock.mockResolvedValueOnce(res({ message: "Password updated" }));
      const { changePassword } = useAuth();

      const result = await changePassword("Password1", "Password2");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/password");
      expect(options.method).toBe("PUT");
      expect(JSON.parse(options.body)).toMatchObject({
        current_password: "Password1",
        new_password: "Password2",
      });
    });

    it("surfaces a wrong current password (401) without clearing session", async () => {
      localStorage.setItem("token", "jwt-xyz");
      fetchMock.mockResolvedValueOnce(
        res({ error: "Current password is incorrect" }, false, 401)
      );
      const { changePassword } = useAuth();
      const result = await changePassword("wrong", "Password2");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Current password is incorrect");
      // Wrong current password must NOT clear the stored session.
      expect(localStorage.getItem("token")).toBe("jwt-xyz");
    });

    it("rejects a weak new password without calling the API", async () => {
      const { changePassword } = useAuth();
      const result = await changePassword("Password1", "weak");
      expect(result.success).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("DELETEs /account with the password and clears the session", async () => {
      localStorage.setItem("token", "jwt-xyz");
      localStorage.setItem("user", JSON.stringify(USER));
      fetchMock.mockResolvedValueOnce(res({ message: "Account deleted" }));
      const { deleteAccount, isAuthenticated } = useAuth();

      const result = await deleteAccount("Password1");

      expect(result.success).toBe(true);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain("/api/account");
      expect(options.method).toBe("DELETE");
      expect(JSON.parse(options.body)).toMatchObject({ password: "Password1" });
      expect(isAuthenticated.value).toBe(false);
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("keeps the session on a wrong password", async () => {
      localStorage.setItem("token", "jwt-xyz");
      fetchMock.mockResolvedValueOnce(
        res({ error: "Password is incorrect" }, false, 401)
      );
      const { deleteAccount } = useAuth();
      const result = await deleteAccount("wrong");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Password is incorrect");
      // A failed deletion must keep the stored session intact.
      expect(localStorage.getItem("token")).toBe("jwt-xyz");
    });
  });
});
