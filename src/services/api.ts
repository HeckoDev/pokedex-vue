/**
 * HTTP client for the Pokédex backend API.
 *
 * Reads the base URL from `VITE_API_URL` and automatically attaches the
 * JWT bearer token (stored in localStorage under "token") to every request.
 */

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8080";

const TOKEN_KEY = "token";

/**
 * Error thrown when the API responds with a non-2xx status.
 * `status` is the HTTP status code and `message` the server-provided error.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  /** Whether the request requires the Authorization header. Defaults to false. */
  auth?: boolean;
  /** Optional JSON body. Serialized automatically. */
  body?: unknown;
}

/**
 * Perform an authenticated (or public) JSON request against the API.
 * The path must start with "/" and is prefixed with the API base + "/api".
 */
async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Network / CORS / server unreachable
    throw new ApiError("Unable to reach the server", 0);
  }

  const isNoContent = response.status === 204;
  const data = isNoContent ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>("GET", path, { auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>("POST", path, { body, auth }),
  put: <T>(path: string, body?: unknown, auth = false) =>
    request<T>("PUT", path, { body, auth }),
  delete: <T>(path: string, body?: unknown, auth = false) =>
    request<T>("DELETE", path, { body, auth }),
  baseUrl: API_BASE_URL,
};
