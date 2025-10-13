import type { User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch(createApiUrl('/auth/session').toString(), {
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('failed to fetch session:', error);
    return null;
  }
}

export function getLoginUrl(redirect?: string): string {
  return createUrlWithRedirect('/auth/login', redirect);
}

export function getLogoutUrl(redirect?: string): string {
  return createUrlWithRedirect('/auth/logout', redirect);
}

function createUrlWithRedirect(path: string, redirect?: string) {
  const url = createApiUrl(path);

  if (redirect) {
    url.searchParams.set('redirect', redirect);
  }

  return url.toString();
}

function createApiUrl(path: string) {
  const base = API_BASE_URL.trim();

  if (base) {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return new URL(normalizedPath, ensureTrailingSlash(base));
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(path, window.location.origin);
  }

  throw new Error('Unable to resolve API base URL for the current environment');
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}
