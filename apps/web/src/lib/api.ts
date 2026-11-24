import type {
  Article,
  ArticleWithContent,
  CreatedToken,
  ReadingProgress,
  UpdateArticle,
  User,
} from '@later/types';

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (!response.ok) {
    throw new Error(`request to ${path} failed: ${response.status}`);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export function getArticles(): Promise<Article[]> {
  return request('/articles');
}

export function getArticle(articleId: string): Promise<ArticleWithContent> {
  return request(`/articles/${articleId}`);
}

export function updateArticle(
  articleId: string,
  update: UpdateArticle
): Promise<Article> {
  return request(`/articles/${articleId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

export function saveProgress(
  articleId: string,
  progress: ReadingProgress
): Promise<ReadingProgress> {
  return request(`/articles/${articleId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(progress),
  });
}

export function deleteArticle(articleId: string): Promise<void> {
  return request(`/articles/${articleId}`, { method: 'DELETE' });
}

export async function createToken(): Promise<string> {
  const { token } = await request<CreatedToken>('/tokens', {
    method: 'POST',
  });

  return token;
}
