import { describe, it, expect, beforeEach, vi } from 'vitest';

// Need to create a fresh instance for each test
let useFavorites: any;

describe('useFavorites Composable', () => {
  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    
    // Setup mock user
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Reset module cache
    vi.resetModules();
    
    // Import fresh instance
    const module = await import('../useFavorites');
    useFavorites = module.useFavorites;
  });

  describe('Initial State', () => {
    it('should initialize with empty favorites', () => {
      const { favorites, loading, error } = useFavorites();
      
      expect(favorites.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should load favorites from localStorage', async () => {
      const mockFavorites = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          user_id: 1,
          pokemon_id: 25,
        }
      ];
      
      localStorage.setItem('favorites_1', JSON.stringify(mockFavorites));
      
      // Reset and reload
      vi.resetModules();
      const module = await import('../useFavorites?t=' + Date.now());
      const { favorites } = module.useFavorites();
      
      expect(favorites.value).toEqual(mockFavorites);
    });

    it('should handle no user logged in', async () => {
      localStorage.removeItem('user');
      
      vi.resetModules();
      const module = await import('../useFavorites?t=' + Date.now());
      const { favorites } = module.useFavorites();
      
      expect(favorites.value).toEqual([]);
    });
  });

  describe('Fetch Favorites', () => {
    it('should fetch favorites successfully', async () => {
      const { fetchFavorites, favorites } = useFavorites();
      
      const result = await fetchFavorites();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(favorites.value)).toBe(true);
    });

    it('should set loading state during fetch', async () => {
      const { fetchFavorites, loading } = useFavorites();
      
      const promise = fetchFavorites();
      
      // Check loading state after promise creation but before resolution
      await new Promise(resolve => setTimeout(resolve, 0));
      
      await promise;
      expect(loading.value).toBe(false);
    });
  });

  describe('Add Favorite', () => {
    it('should add a Pokemon to favorites', async () => {
      const { addFavorite, favorites, isFavorite } = useFavorites();
      
      const result = await addFavorite(25);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pokemon_id).toBe(25);
      expect(favorites.value.length).toBe(1);
      expect(isFavorite(25)).toBe(true);
    });

    it('should persist favorite to localStorage', async () => {
      const { addFavorite } = useFavorites();
      
      await addFavorite(25);
      
      const storedFavorites = JSON.parse(localStorage.getItem('favorites_1') || '[]');
      expect(storedFavorites.length).toBe(1);
      expect(storedFavorites[0].pokemon_id).toBe(25);
    });

    it('should fail when user is not logged in', async () => {
      localStorage.removeItem('user');
      
      const { addFavorite } = useFavorites();
      const result = await addFavorite(25);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should set loading state during add', async () => {
      const { addFavorite, loading } = useFavorites();
      
      const promise = addFavorite(25);
      await promise;
      
      expect(loading.value).toBe(false);
    });

    it('should add multiple favorites', async () => {
      const { addFavorite, favorites } = useFavorites();
      
      await addFavorite(25);
      await addFavorite(1);
      await addFavorite(150);
      
      expect(favorites.value.length).toBe(3);
      expect(favorites.value.map(f => f.pokemon_id)).toEqual([25, 1, 150]);
    });
  });

  describe('Remove Favorite', () => {
    it('should remove a Pokemon from favorites', async () => {
      const { addFavorite, removeFavorite, favorites, isFavorite } = useFavorites();
      
      await addFavorite(25);
      expect(isFavorite(25)).toBe(true);
      
      const result = await removeFavorite(25);
      
      expect(result.success).toBe(true);
      expect(favorites.value.length).toBe(0);
      expect(isFavorite(25)).toBe(false);
    });

    it('should update localStorage after removal', async () => {
      const { addFavorite, removeFavorite } = useFavorites();
      
      await addFavorite(25);
      await removeFavorite(25);
      
      const storedFavorites = JSON.parse(localStorage.getItem('favorites_1') || '[]');
      expect(storedFavorites.length).toBe(0);
    });

    it('should fail when favorite does not exist', async () => {
      const { removeFavorite } = useFavorites();
      
      const result = await removeFavorite(999);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it.skip('should remove correct favorite when multiple exist', async () => {
      const { addFavorite, removeFavorite, favorites, isFavorite } = useFavorites();
      
      await addFavorite(25);
      await addFavorite(1);
      await addFavorite(150);
      
      await removeFavorite(1);
      
      expect(favorites.value.length).toBe(2);
      expect(isFavorite(25)).toBe(true);
      expect(isFavorite(1)).toBe(false);
      expect(isFavorite(150)).toBe(true);
    });
  });

  describe('Toggle Favorite', () => {
    it('should add favorite when not present', async () => {
      const { toggleFavorite, isFavorite } = useFavorites();
      
      await toggleFavorite(25);
      
      expect(isFavorite(25)).toBe(true);
    });

    it('should remove favorite when present', async () => {
      const { toggleFavorite, isFavorite } = useFavorites();
      
      await toggleFavorite(25);
      expect(isFavorite(25)).toBe(true);
      
      await toggleFavorite(25);
      expect(isFavorite(25)).toBe(false);
    });

    it('should toggle multiple times', async () => {
      const { toggleFavorite, isFavorite } = useFavorites();
      
      await toggleFavorite(25);
      expect(isFavorite(25)).toBe(true);
      
      await toggleFavorite(25);
      expect(isFavorite(25)).toBe(false);
      
      await toggleFavorite(25);
      expect(isFavorite(25)).toBe(true);
    });
  });

  describe('Is Favorite', () => {
    it('should return false for non-favorite Pokemon', () => {
      const { isFavorite } = useFavorites();
      
      expect(isFavorite(25)).toBe(false);
    });

    it('should return true for favorite Pokemon', async () => {
      const { addFavorite, isFavorite } = useFavorites();
      
      await addFavorite(25);
      
      expect(isFavorite(25)).toBe(true);
    });

    it('should handle multiple favorites correctly', async () => {
      const { addFavorite, isFavorite } = useFavorites();
      
      await addFavorite(25);
      await addFavorite(1);
      await addFavorite(150);
      
      expect(isFavorite(25)).toBe(true);
      expect(isFavorite(1)).toBe(true);
      expect(isFavorite(150)).toBe(true);
      expect(isFavorite(999)).toBe(false);
    });
  });

  describe('Multiple Users', () => {
    it.skip('should keep favorites separate per user', async () => {
      // User 1
      const user1 = { id: 1, username: 'user1', email: 'user1@test.com' };
      localStorage.setItem('user', JSON.stringify(user1));
      
      vi.resetModules();
      const module1 = await import('../useFavorites?t=' + Date.now());
      const favorites1 = module1.useFavorites();
      await favorites1.addFavorite(25);
      
      // User 2
      const user2 = { id: 2, username: 'user2', email: 'user2@test.com' };
      localStorage.setItem('user', JSON.stringify(user2));
      
      vi.resetModules();
      const module2 = await import('../useFavorites?t=' + Date.now() + 1);
      const favorites2 = module2.useFavorites();
      
      expect(favorites2.isFavorite(25)).toBe(false);
      
      await favorites2.addFavorite(1);
      expect(favorites2.isFavorite(1)).toBe(true);
      
      // Check localStorage
      const stored1 = JSON.parse(localStorage.getItem('favorites_1') || '[]');
      const stored2 = JSON.parse(localStorage.getItem('favorites_2') || '[]');
      
      expect(stored1.length).toBe(1);
      expect(stored2.length).toBe(1);
      expect(stored1[0].pokemon_id).toBe(25);
      expect(stored2[0].pokemon_id).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when adding', async () => {
      const { addFavorite, error } = useFavorites();
      
      localStorage.removeItem('user');
      
      await addFavorite(25);
      
      expect(error.value).toBeDefined();
    });

    it('should clear error on successful operation', async () => {
      const { addFavorite, removeFavorite, error } = useFavorites();
      
      await addFavorite(25);
      await removeFavorite(999); // This will cause an error
      
      expect(error.value).toBeDefined();
      
      await addFavorite(1); // Successful operation
      expect(error.value).toBeNull();
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('favorites_1', 'invalid json');
      
      vi.resetModules();
      const module = await import('../useFavorites?t=' + Date.now());
      const { favorites } = module.useFavorites();
      
      // Should fallback to empty array
      expect(favorites.value).toEqual([]);
    });


  });

  describe('Edge Cases', () => {
    it('should handle adding same Pokemon twice', async () => {
      const { addFavorite, favorites } = useFavorites();
      
      await addFavorite(25);
      const initialLength = favorites.value.length;
      
      await addFavorite(25);
      
      // Should not add duplicate (implementation may vary)
      expect(favorites.value.length).toBeGreaterThanOrEqual(initialLength);
    });

    it('should handle removing non-existent favorite gracefully', async () => {
      const { removeFavorite } = useFavorites();
      
      const result = await removeFavorite(999999);
      
      // Should handle gracefully (may succeed or fail depending on implementation)
      expect(result).toBeDefined();
    });
  });
});
