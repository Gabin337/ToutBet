import type { Role } from './types';

export function parseJwt(token: string): { sub?: string; role?: Role; exp?: number } | null {
  try {
    const [, payloadB64] = token.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { sub?: string; role?: Role; exp?: number };
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const p = parseJwt(token);
  const exp = p?.exp;
  if (!exp) return true;
  return Date.now() / 1000 >= exp - 10;
}

