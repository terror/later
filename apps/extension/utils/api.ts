import { browser, storage } from '#imports';
import { UnauthorizedError } from '@/lib/errors';
import { isSavable } from '@/lib/save';

export const API_URL = import.meta.env.WXT_API_URL || 'https://api.later.sh';

export const WEB_URL = import.meta.env.WXT_WEB_URL || 'https://www.later.sh';

export const token = storage.defineItem<string>('local:token');

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

export async function savePage(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined || !isSavable(tab.url)) {
    throw new Error('This page can’t be saved.');
  }

  const html = await browser.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    })
    .then(([result]) => result?.result as string | undefined)
    .catch(() => undefined);

  const response = await request('/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: tab.url, html }),
  });

  if (!response.ok) {
    throw new Error('Something went wrong. Try again.');
  }

  const article = await response.json();

  return article.title ?? null;
}

export async function revokeToken(): Promise<void> {
  await request('/tokens', { method: 'DELETE' }).catch(() => undefined);
  await token.removeValue();
}
