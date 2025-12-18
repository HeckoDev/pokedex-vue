import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock sanitizeInput
vi.mock('../../utils/security', () => ({
  sanitizeInput: (input: string) => input.replace(/[<>]/g, ''),
}));

let useTeams: any;

describe('useTeams Composable', () => {
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
    const module = await import('../useTeams');
    useTeams = module.useTeams;
  });

  describe('Initial State', () => {
    it('should initialize with empty teams', () => {
      const { teams, currentTeam, loading, error } = useTeams();
      
      expect(teams.value).toEqual([]);
      expect(currentTeam.value).toBeNull();
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should load teams from localStorage', async () => {
      const mockTeams = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: 1,
          name: 'My Team',
          pokemons: [],
        }
      ];
      
      localStorage.setItem('teams_1', JSON.stringify(mockTeams));
      
      // Reset and reload
      vi.resetModules();
      const module = await import('../useTeams?t=' + Date.now());
      const { teams } = module.useTeams();
      
      expect(teams.value).toEqual(mockTeams);
    });

    it('should handle no user logged in', async () => {
      localStorage.removeItem('user');
      
      vi.resetModules();
      const module = await import('../useTeams?t=' + Date.now());
      const { teams } = module.useTeams();
      
      expect(teams.value).toEqual([]);
    });
  });

  describe('Fetch Teams', () => {
    it('should fetch teams successfully', async () => {
      const { fetchTeams, teams } = useTeams();
      
      const result = await fetchTeams();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(teams.value)).toBe(true);
    });

    it('should set loading state during fetch', async () => {
      const { fetchTeams, loading } = useTeams();
      
      const promise = fetchTeams();
      await promise;
      
      expect(loading.value).toBe(false);
    });
  });

  describe('Create Team', () => {
    it('should create a new team', async () => {
      const { createTeam, teams } = useTeams();
      
      const result = await createTeam('My First Team');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('My First Team');
      expect(teams.value.length).toBe(1);
    });

    it('should persist team to localStorage', async () => {
      const { createTeam } = useTeams();
      
      await createTeam('Test Team');
      
      const storedTeams = JSON.parse(localStorage.getItem('teams_1') || '[]');
      expect(storedTeams.length).toBe(1);
      expect(storedTeams[0].name).toBe('Test Team');
    });

    it('should fail when user is not logged in', async () => {
      localStorage.removeItem('user');
      
      const { createTeam } = useTeams();
      const result = await createTeam('Test Team');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should sanitize team name', async () => {
      const { createTeam } = useTeams();
      
      await createTeam('Team <script>alert("xss")</script>');
      
      const storedTeams = JSON.parse(localStorage.getItem('teams_1') || '[]');
      expect(storedTeams[0].name).not.toContain('<script>');
    });

    it('should initialize team with empty pokemons array', async () => {
      const { createTeam, teams } = useTeams();
      
      await createTeam('Test Team');
      
      expect(teams.value[0].pokemons).toEqual([]);
    });

    it('should create multiple teams', async () => {
      const { createTeam, teams } = useTeams();
      
      await createTeam('Team 1');
      await createTeam('Team 2');
      await createTeam('Team 3');
      
      expect(teams.value.length).toBe(3);
      expect(teams.value.map((t: any) => t.name)).toEqual(['Team 1', 'Team 2', 'Team 3']);
    });
  });

  describe('Fetch Team', () => {
    it('should get team by ID', async () => {
      const { createTeam, fetchTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      const result = await fetchTeam(teamId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(teamId);
    });

    it('should set current team', async () => {
      const { createTeam, fetchTeam, currentTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await fetchTeam(teamId);
      
      expect(currentTeam.value).toBeDefined();
      expect(currentTeam.value?.id).toBe(teamId);
    });

    it('should fail for non-existent team', async () => {
      const { fetchTeam } = useTeams();
      
      const result = await fetchTeam(999);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Delete Team', () => {
    it('should delete a team', async () => {
      const { createTeam, deleteTeam, teams } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      expect(teams.value.length).toBe(1);
      
      const result = await deleteTeam(teamId);
      
      expect(result.success).toBe(true);
      expect(teams.value.length).toBe(0);
    });

    it('should update localStorage after deletion', async () => {
      const { createTeam, deleteTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await deleteTeam(teamId);
      
      const storedTeams = JSON.parse(localStorage.getItem('teams_1') || '[]');
      expect(storedTeams.length).toBe(0);
    });

    it('should clear current team if deleted', async () => {
      const { createTeam, fetchTeam, deleteTeam, currentTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await fetchTeam(teamId);
      expect(currentTeam.value).toBeDefined();
      
      await deleteTeam(teamId);
      expect(currentTeam.value).toBeNull();
    });

    it.skip('should not affect other teams when deleting', async () => {
      const { createTeam, deleteTeam, teams } = useTeams();
      
      const team1 = await createTeam('Team 1');
      const team2 = await createTeam('Team 2');
      const team3 = await createTeam('Team 3');
      
      const beforeDelete = teams.value.length;
      await deleteTeam(team2.data!.id);
      
      expect(teams.value.length).toBe(beforeDelete - 1);
      expect(teams.value.find((t: any) => t.id === team1.data!.id)).toBeDefined();
      expect(teams.value.find((t: any) => t.id === team3.data!.id)).toBeDefined();
    });
  });

  describe('Add Pokemon to Team', () => {
    it('should add Pokemon to team', async () => {
      const { createTeam, addPokemonToTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      const result = await addPokemonToTeam(teamId, 25, 1);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pokemon_id).toBe(25);
      expect(result.data?.position).toBe(1);
    });

    it('should add Pokemon with nickname', async () => {
      const { createTeam, addPokemonToTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      const result = await addPokemonToTeam(teamId, 25, 1, 'Sparky', false);
      
      expect(result.data?.nickname).toBe('Sparky');
    });

    it('should add shiny Pokemon', async () => {
      const { createTeam, addPokemonToTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      const result = await addPokemonToTeam(teamId, 25, 1, '', true);
      
      expect(result.data?.is_shiny).toBe(true);
    });

    it('should update team pokemons array', async () => {
      const { createTeam, addPokemonToTeam, teams } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await addPokemonToTeam(teamId, 25, 1);
      
      const team = teams.value.find((t: any) => t.id === teamId);
      expect(team?.pokemons?.length).toBe(1);
    });

    it('should update current team if active', async () => {
      const { createTeam, fetchTeam, addPokemonToTeam, currentTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await fetchTeam(teamId);
      await addPokemonToTeam(teamId, 25, 1);
      
      expect(currentTeam.value?.pokemons).toBeDefined();
      expect(currentTeam.value?.pokemons!.length).toBeGreaterThan(0);
    });

    it('should add multiple Pokemon to team', async () => {
      const { createTeam, addPokemonToTeam, fetchTeam, teams } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await addPokemonToTeam(teamId, 25, 1);
      await addPokemonToTeam(teamId, 1, 2);
      await addPokemonToTeam(teamId, 150, 3);
      
      // Refetch team to ensure state is updated
      await fetchTeam(teamId);
      const team = teams.value.find((t: any) => t.id === teamId);
      expect(team?.pokemons?.length).toBe(3);
    });
  });

  describe('Remove Pokemon from Team', () => {
    it('should remove Pokemon from team', async () => {
      const { createTeam, addPokemonToTeam, removePokemonFromTeam, teams } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      const addResult = await addPokemonToTeam(teamId, 25, 1);
      const pokemonId = addResult.data!.id;
      
      const result = await removePokemonFromTeam(teamId, pokemonId);
      
      expect(result.success).toBe(true);
      
      const team = teams.value.find((t: any) => t.id === teamId);
      expect(team?.pokemons?.length).toBe(0);
    });

    it('should update current team', async () => {
      const { createTeam, fetchTeam, addPokemonToTeam, removePokemonFromTeam, currentTeam } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await fetchTeam(teamId);
      const addResult = await addPokemonToTeam(teamId, 25, 1);
      const pokemonId = addResult.data!.id;
      
      await removePokemonFromTeam(teamId, pokemonId);
      
      expect(currentTeam.value?.pokemons?.length).toBe(0);
    });

    it('should remove correct Pokemon when multiple exist', async () => {
      const { createTeam, addPokemonToTeam, removePokemonFromTeam, teams } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await addPokemonToTeam(teamId, 25, 1);
      const pokemon2 = await addPokemonToTeam(teamId, 1, 2);
      await addPokemonToTeam(teamId, 150, 3);
      
      await removePokemonFromTeam(teamId, pokemon2.data!.id);
      
      const team = teams.value.find((t: any) => t.id === teamId);
      expect(team?.pokemons?.find((p: any) => p.id === pokemon2.data!.id)).toBeUndefined();
    });
  });

  describe('Team Constraints', () => {
    it('should check if can add Pokemon (under limit)', async () => {
      const { createTeam, addPokemonToTeam, canAddPokemon } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      await addPokemonToTeam(teamId, 25, 1);
      
      expect(canAddPokemon(teamId)).toBe(true);
    });

    it('should check if can add Pokemon (at limit)', async () => {
      const { createTeam, addPokemonToTeam, canAddPokemon } = useTeams();
      
      const createResult = await createTeam('Test Team');
      const teamId = createResult.data!.id;
      
      // Add 6 Pokemon (max limit)
      for (let i = 1; i <= 6; i++) {
        await addPokemonToTeam(teamId, i, i);
      }
      
      expect(canAddPokemon(teamId)).toBe(false);
    });

    it('should check if can create team (under limit)', async () => {
      const { createTeam, canCreateTeam } = useTeams();
      
      await createTeam('Team 1');
      
      expect(canCreateTeam()).toBe(true);
    });

    it('should check if can create team (at limit)', async () => {
      const { createTeam, canCreateTeam } = useTeams();
      
      // Create 3 teams (max limit)
      await createTeam('Team 1');
      await createTeam('Team 2');
      await createTeam('Team 3');
      
      expect(canCreateTeam()).toBe(false);
    });
  });

  describe('Multiple Users', () => {
    it.skip('should keep teams separate per user', async () => {
      // User 1
      const user1 = { id: 1, username: 'user1', email: 'user1@test.com' };
      localStorage.setItem('user', JSON.stringify(user1));
      
      vi.resetModules();
      const module1 = await import('../useTeams?t=' + Date.now());
      const teams1 = module1.useTeams();
      await teams1.createTeam('User 1 Team');
      
      // User 2
      const user2 = { id: 2, username: 'user2', email: 'user2@test.com' };
      localStorage.setItem('user', JSON.stringify(user2));
      
      vi.resetModules();
      const module2 = await import('../useTeams?t=' + Date.now() + 1);
      const teams2 = module2.useTeams();
      
      expect(teams2.teams.value.length).toBe(0);
      
      await teams2.createTeam('User 2 Team');
      
      // Check localStorage
      const stored1 = JSON.parse(localStorage.getItem('teams_1') || '[]');
      const stored2 = JSON.parse(localStorage.getItem('teams_2') || '[]');
      
      expect(stored1.length).toBe(1);
      expect(stored2.length).toBe(1);
      expect(stored1[0].name).toBe('User 1 Team');
      expect(stored2[0].name).toBe('User 2 Team');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const { createTeam, error } = useTeams();
      
      localStorage.removeItem('user');
      
      await createTeam('Test Team');
      
      expect(error.value).toBeDefined();
    });

    it('should clear error on successful operation', async () => {
      const { createTeam, fetchTeam, error } = useTeams();
      
      await createTeam('Test Team');
      await fetchTeam(999); // This will cause an error
      
      expect(error.value).toBeDefined();
      
      await createTeam('Another Team'); // Successful operation
      expect(error.value).toBeNull();
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem('teams_1', 'invalid json');
      
      vi.resetModules();
      const module = await import('../useTeams?t=' + Date.now());
      const { teams } = module.useTeams();
      
      // Should fallback to empty array
      expect(teams.value).toEqual([]);
    });


  });

  describe('Edge Cases', () => {
    it('should handle maximum team limit', async () => {
      const { createTeam, canCreateTeam } = useTeams();
      
      // Create 3 teams (maximum)
      await createTeam('Team 1');
      await createTeam('Team 2');
      await createTeam('Team 3');
      
      expect(canCreateTeam()).toBe(false);
    });

    it('should handle maximum Pokemon per team', async () => {
      const { createTeam, addPokemonToTeam, canAddPokemon } = useTeams();
      
      const result = await createTeam('Full Team');
      const teamId = result.data?.id;
      
      // Add 6 Pokemon (maximum)
      for (let i = 0; i < 6; i++) {
        await addPokemonToTeam(teamId!, i + 1, i + 1);
      }
      
      expect(canAddPokemon(teamId!)).toBe(false);
    });
  });

  describe('Storage Event Handling', () => {
    it('should handle storage changes when userData is null', async () => {
      const { teams } = useTeams();
      
      // Set up invalid user data
      localStorage.setItem('user', 'invalid json');
      
      // Trigger storage event
      const event = new StorageEvent('storage', {
        key: 'teams_1',
        newValue: JSON.stringify([{ id: 1, name: 'Team 1', user_id: 1, pokemons: [] }]),
      });
      
      window.dispatchEvent(event);
      
      // Teams should not change since userData is invalid
      expect(teams.value).toEqual([]);
    });

    it('should handle storage changes when user is not logged in', async () => {
      const { teams } = useTeams();
      
      localStorage.removeItem('user');
      
      // Trigger storage event
      const event = new StorageEvent('storage', {
        key: 'teams_1',
        newValue: JSON.stringify([{ id: 1, name: 'Team 1', user_id: 1, pokemons: [] }]),
      });
      
      window.dispatchEvent(event);
      
      // Teams should not change since user is not logged in
      expect(teams.value).toEqual([]);
    });

    it.skip('should update teams on storage event for correct user', async () => {
      const { teams } = useTeams();
      
      // Wait for event listener to be set up
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const newTeams = [
        { id: 1, name: 'Team 1', user_id: 1, pokemons: [], created_at: new Date().toISOString() },
        { id: 2, name: 'Team 2', user_id: 1, pokemons: [], created_at: new Date().toISOString() },
      ];
      
      // Trigger storage event with correct key
      const event = new StorageEvent('storage', {
        key: 'teams_1',
        newValue: JSON.stringify(newTeams),
      });
      
      window.dispatchEvent(event);
      
      // Teams should update from storage event
      expect(teams.value).toEqual(newTeams);
    });

    it('should ignore storage events for different keys', async () => {
      const { teams } = useTeams();
      
      const newTeams = [
        { id: 1, name: 'Team 1', user_id: 2, pokemons: [], created_at: new Date().toISOString() },
      ];
      
      // Trigger storage event with different key (different user)
      const event = new StorageEvent('storage', {
        key: 'teams_2',
        newValue: JSON.stringify(newTeams),
      });
      
      window.dispatchEvent(event);
      
      // Teams should not change
      expect(teams.value).toEqual([]);
    });

    it('should handle storage event without newValue', async () => {
      const { teams } = useTeams();
      
      // Trigger storage event without newValue
      const event = new StorageEvent('storage', {
        key: 'teams_1',
        newValue: null,
      });
      
      window.dispatchEvent(event);
      
      // Should not throw error
      expect(teams.value).toEqual([]);
    });
  });

  describe('Save to Storage Error Handling', () => {
    it.skip('should handle save errors gracefully', async () => {
      const { createTeam, error } = useTeams();
      
      // Mock safeSetItem to fail
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
        Object.defineProperty(quotaError, 'name', { value: 'QuotaExceededError' });
        throw quotaError;
      });
      
      const alertMock = vi.fn();
      globalThis.alert = alertMock;
      
      await createTeam('Test Team');
      
      // Error might be set if save fails
      
      localStorage.setItem = originalSetItem;
    });
  });
});
