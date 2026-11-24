import { storage } from '#imports';

export const API_URL = import.meta.env.WXT_API_URL || 'https://api.later.sh';

export const WEB_URL = import.meta.env.WXT_WEB_URL || 'https://www.later.sh';

export const token = storage.defineItem<string>('local:token');

export class UnauthorizedError extends Error {}

export async function request(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const value = await token.getValue();

  if (!value) {
    throw new UnauthorizedError();
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${value}`,
    },
  });

  if (response.status === 401) {
    await token.removeValue();
    throw new UnauthorizedError();
  }

  return response;
}
