import type { User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
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
  return `${API_BASE_URL}/auth/login?redirect=${window.location.href}`;
}

export function getLogoutUrl(): string {
  return `${API_BASE_URL}/auth/logout?redirect=${window.location.href}`;
}
