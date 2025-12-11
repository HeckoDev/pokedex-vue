import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('useAuth Composable - Integration Tests', () => {
  let useAuth: any;

  beforeEach(async () => {
    localStorage.clear();
    // Clear module cache and reimport to get fresh state
    vi.resetModules();
    
    // Mock dependencies
    vi.doMock('../../utils/validation', () => ({
      validateEmail: (email: string) => {
        if (!email || !email.includes('@')) {
          return { valid: false, error: 'Invalid email' };
        }
        return { valid: true };
      },
      validatePassword: (password: string) => {
        if (password.length < 8) {
          return { valid: false, error: 'Password too short' };
        }
        return { valid: true };
      },
      validateUsername: (username: string) => {
        if (username.length < 3) {
          return { valid: false, error: 'Username too short' };
        }
        return { valid: true };
      },
    }));

    vi.doMock('../../utils/security', () => ({
      sanitizeInput: (input: string) => input.replace(/[<>]/g, ''),
      hashPassword: async (password: string, salt: string) => `hashed_${password}`,
      generateSalt: () => 'mock-salt',
    }));
    
    // Import composable with mocked dependencies
    const module = await import('../useAuth');
    useAuth = module.useAuth;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with no user and no token', () => {
      const { token, user, isAuthenticated } = useAuth();
      
      expect(token.value).toBeNull();
      expect(user.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
    });

    it('should load existing session from localStorage', async () => {
      // Setup existing session
      localStorage.setItem('token', 'existing-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        username: 'existinguser',
        email: 'existing@test.com'
      }));
      
      // Clear module cache and reimport
      vi.resetModules();
      vi.doMock('../../utils/validation', () => ({
        validateEmail: vi.fn(() => ({ valid: true })),
        validatePassword: vi.fn(() => ({ valid: true })),
        validateUsername: vi.fn(() => ({ valid: true })),
      }));
      vi.doMock('../../utils/security', () => ({
        sanitizeInput: (input: string) => input,
        hashPassword: vi.fn(),
        generateSalt: vi.fn(),
      }));
      
      const module = await import('../useAuth?t=' + Date.now());
      const { token, user, isAuthenticated } = module.useAuth();
      
      expect(token.value).toBe('existing-token');
      expect(user.value).toEqual({
        id: 1,
        username: 'existinguser',
        email: 'existing@test.com'
      });
      expect(isAuthenticated.value).toBe(true);
    });
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const { register, user, isAuthenticated } = useAuth();
      
      const result = await register('newuser', 'test@example.com', 'Password123');
      
      expect(result.success).toBe(true);
      expect(user.value).toBeDefined();
      expect(user.value?.username).toBe('newuser');
      expect(user.value?.email).toBe('test@example.com');
      expect(isAuthenticated.value).toBe(true);
    });

    it('should validate email format', async () => {
      const { register } = useAuth();
      
      const result = await register('testuser', 'invalid-email', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should validate password strength', async () => {
      const { register } = useAuth();
      
      const result = await register('testuser', 'test@example.com', 'weak');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password');
    });

    it('should validate username', async () => {
      const { register } = useAuth();
      
      const result = await register('ab', 'test@example.com', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Username');
    });
  });

  describe('Login', () => {
    it('should login existing user successfully', async () => {
      const { register, login, logout, user, isAuthenticated } = useAuth();
      
      // First register a user
      await register('testuser', 'test@example.com', 'Password123');
      
      // Logout first
      logout();
      expect(isAuthenticated.value).toBe(false);
      
      // Then login
      const result = await login('test@example.com', 'Password123');
      
      expect(result.success).toBe(true);
      expect(user.value).toBeDefined();
      expect(user.value?.email).toBe('test@example.com');
      expect(isAuthenticated.value).toBe(true);
    });

    it('should fail with incorrect credentials', async () => {
      const { register, login } = useAuth();
      
      await register('testuser', 'test@example.com', 'Password123');
      
      const result = await login('test@example.com', 'WrongPassword');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for non-existent user', async () => {
      const { login } = useAuth();
      
      const result = await login('nonexistent@example.com', 'Password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Logout', () => {
    it('should logout and clear session', async () => {
      const { register, logout, token, user, isAuthenticated } = useAuth();
      
      await register('testuser', 'test@example.com', 'Password123');
      expect(isAuthenticated.value).toBe(true);
      
      logout();
      
      expect(token.value).toBeNull();
      expect(user.value).toBeNull();
      expect(isAuthenticated.value).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
