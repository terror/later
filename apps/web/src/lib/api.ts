import type { User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch('/auth/session', {
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

export function getLoginUrl(): string {
  return `${API_BASE_URL}/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
}

export function getLogoutUrl(): string {
  return `/auth/logout?redirect=${encodeURIComponent(window.location.href)}`;
}

export async function createToken(): Promise<string> {
  const response = await fetch('/api/tokens', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`failed to create token: ${response.status}`);
  }

  const { token } = await response.json();

  return token;
}
