import type { Market, MyBet, TokenPair, User } from './types';

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE ||
  'http://127.0.0.1:8010';
const ACCESS_KEY = 'tb_access_token';

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function setAccessToken(token: string | null) {
  if (!token) localStorage.removeItem(ACCESS_KEY);
  else localStorage.setItem(ACCESS_KEY, token);
}

async function request<T>(path: string, opts: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  headers.set('Content-Type', 'application/json');
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    credentials: 'include', // refresh cookie
  });

  if (res.status === 401 && path !== '/auth/refresh' && opts.auth !== false) {
    // Attempt silent refresh once
    const refreshed = await refresh();
    if (refreshed) {
      return request<T>(path, opts);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: unknown })?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : detail
          ? JSON.stringify(detail)
          : typeof body?.message === 'string'
            ? body.message
            : 'Request failed';
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function register(email: string, password: string) {
  return request<User>('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  const tok = await request<TokenPair>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(tok.access_token);
  return tok;
}

export async function refresh(): Promise<boolean> {
  try {
    const tok = await request<TokenPair>('/auth/refresh', { method: 'POST', auth: false });
    setAccessToken(tok.access_token);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function logout() {
  setAccessToken(null);
  return request<{ message: string }>('/auth/logout', { method: 'POST', auth: false });
}

export async function me() {
  return request<User>('/api/me');
}

export async function fund(amount_eur: number) {
  return request<User>('/api/fund', { method: 'POST', body: JSON.stringify({ amount_eur }) });
}

export async function listMarkets() {
  return request<Market[]>('/public/markets', { auth: false });
}

export async function getMarket(id: number) {
  return request<Market>(`/public/markets/${id}`, { auth: false });
}

export async function createMarket(title: string, description: string) {
  return request<Market>('/api/markets', { method: 'POST', body: JSON.stringify({ title, description }) });
}

export async function placeBet(marketId: number, side: 'yes' | 'no', amount_tokens: number) {
  return request(`/api/markets/${marketId}/bets`, { method: 'POST', body: JSON.stringify({ side, amount_tokens }) });
}

export async function myBets() {
  return request<MyBet[]>('/api/my-bets');
}

export async function adminPending() {
  return request<Market[]>('/api/admin/markets/pending');
}

export async function adminResolve(marketId: number, outcome: 'yes' | 'no') {
  return request<Market>(`/api/admin/markets/${marketId}/resolve`, { method: 'POST', body: JSON.stringify({ outcome }) });
}

export const access = {
  getAccessToken,
  setAccessToken,
};

