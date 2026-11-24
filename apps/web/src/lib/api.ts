import type {
  Article,
  ArticlePage,
  ArticleWithContent,
  CreateHighlight,
  CreatedToken,
  Highlight,
  ListArticles,
  ReadingProgress,
  UpdateArticle,
  UpdateHighlight,
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

export function getArticles({
  cursor,
  limit,
}: ListArticles): Promise<ArticlePage> {
  const search = new URLSearchParams();

  if (cursor !== undefined) {
    search.set('cursor', cursor);
  }

  if (limit !== undefined) {
    search.set('limit', String(limit));
  }

  return request(search.size === 0 ? '/articles' : `/articles?${search}`);
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

export function getHighlights(articleId: string): Promise<Highlight[]> {
  return request(`/articles/${articleId}/highlights`);
}

export function createHighlight(
  articleId: string,
  range: CreateHighlight
): Promise<Highlight> {
  return request(`/articles/${articleId}/highlights`, {
    method: 'POST',
    body: JSON.stringify(range),
  });
}

export function updateHighlight(
  articleId: string,
  highlightId: string,
  update: UpdateHighlight
): Promise<Highlight> {
  return request(`/articles/${articleId}/highlights/${highlightId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}

export function deleteHighlight(
  articleId: string,
  highlightId: string
): Promise<void> {
  return request(`/articles/${articleId}/highlights/${highlightId}`, {
    method: 'DELETE',
  });
}

export async function createToken(): Promise<string> {
  const { token } = await request<CreatedToken>('/tokens', {
    method: 'POST',
  });

  return token;
}
