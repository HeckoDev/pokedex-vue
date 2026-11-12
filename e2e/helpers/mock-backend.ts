import type { Page, Route } from '@playwright/test';

const now = '2024-01-01T00:00:00Z';

export const TEST_USER = {
  id: 1,
  username: 'ash',
  email: 'ash@example.com',
  created_at: now,
  updated_at: now,
};

export const VALID_PASSWORD = 'Valid-password1!';

interface MockState {
  favorites: Array<{ id: number; created_at: string; user_id: number; pokemon_id: number }>;
  teams: Array<{ id: number; created_at: string; updated_at: string; user_id: number; name: string; pokemons: any[] }>;
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    },
    body: status === 204 ? undefined : JSON.stringify(body),
  });

/**
 * Stubs the Pokédex backend (`/api/**`) with an in-memory implementation so
 * authenticated flows can be tested without a real server.
 */
export async function mockBackend(page: Page, options: { authenticated?: boolean } = {}) {
  const state: MockState = { favorites: [], teams: [] };
  let nextId = 1;

  if (options.authenticated) {
    await page.addInitScript((user) => {
      localStorage.setItem('token', 'e2e-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, TEST_USER);
  }

  await page.route(/\/api\/(?!v2)/, async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname.replace(/^.*\/api/, '');
    const body = method === 'POST' || method === 'PUT' ? request.postDataJSON() : null;

    if (method === 'OPTIONS') return json(route, 204, null);

    if (path === '/login' && method === 'POST') {
      return body?.password === VALID_PASSWORD
        ? json(route, 200, { token: 'e2e-token', user: TEST_USER })
        : json(route, 401, { error: 'Invalid credentials' });
    }

    if (path === '/profile') return json(route, 200, TEST_USER);

    if (path === '/favorites' && method === 'GET') return json(route, 200, state.favorites);
    if (path === '/favorites' && method === 'POST') {
      const favorite = { id: nextId++, created_at: now, user_id: 1, pokemon_id: body.pokemon_id };
      state.favorites.push(favorite);
      return json(route, 201, favorite);
    }
    const favoriteMatch = path.match(/^\/favorites\/(\d+)$/);
    if (favoriteMatch && method === 'DELETE') {
      state.favorites = state.favorites.filter((f) => f.pokemon_id !== Number(favoriteMatch[1]));
      return json(route, 204, null);
    }

    if (path === '/teams' && method === 'GET') return json(route, 200, state.teams);
    if (path === '/teams' && method === 'POST') {
      const team = { id: nextId++, created_at: now, updated_at: now, user_id: 1, name: body.name, pokemons: [] };
      state.teams.push(team);
      return json(route, 201, team);
    }
    const teamMatch = path.match(/^\/teams\/(\d+)(?:\/pokemons(?:\/(\d+))?)?$/);
    if (teamMatch) {
      const team = state.teams.find((t) => t.id === Number(teamMatch[1]));
      if (!team) return json(route, 404, { error: 'Team not found' });
      if (path.endsWith('/pokemons') && method === 'POST') {
        const pokemon = {
          id: nextId++,
          created_at: now,
          team_id: team.id,
          pokemon_id: body.pokemon_id,
          position: body.position,
          nickname: body.nickname ?? '',
          is_shiny: false,
        };
        team.pokemons.push(pokemon);
        return json(route, 201, pokemon);
      }
      if (teamMatch[2] && method === 'DELETE') {
        team.pokemons = team.pokemons.filter((p) => p.id !== Number(teamMatch[2]));
        return json(route, 204, null);
      }
      if (method === 'DELETE') {
        state.teams = state.teams.filter((t) => t.id !== team.id);
        return json(route, 204, null);
      }
      return json(route, 200, team);
    }

    return json(route, 404, { error: 'Not found' });
  });

  return state;
}
