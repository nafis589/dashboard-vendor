const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';
export const TOKEN_KEY = 'vendor_token';

type RequestOptions = {
  skipUnauthorizedRedirect?: boolean;
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  window.location.href = '/login';
}

async function parseResponse<T>(res: Response, options?: RequestOptions): Promise<T> {
  if (res.status === 401 && !options?.skipUnauthorizedRedirect) {
    clearToken();
    redirectToLogin();
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!res.ok) {
    const message =
      typeof json === 'object' &&
      json !== null &&
      'error' in json &&
      typeof (json as { error?: { message?: string } }).error?.message === 'string'
        ? (json as { error: { message: string } }).error.message
        : `Erreur HTTP ${res.status}`;
    throw new Error(message);
  }

  return json;
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(res, options);
}

export const api = {
  get: <T>(endpoint: string): Promise<T> => request<T>('GET', endpoint),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('POST', endpoint, body, options),

  patch: <T>(endpoint: string, body?: unknown): Promise<T> =>
    request<T>('PATCH', endpoint, body),

  delete: <T>(endpoint: string): Promise<T> => request<T>('DELETE', endpoint),
};
