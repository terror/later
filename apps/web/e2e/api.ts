import type {
  Article,
  ArticleWithContent,
  CreatedToken,
  UpdateArticle,
  User,
} from '@later/types';
import type { Page } from '@playwright/test';

import { content, token } from './fixtures';

export async function mockApi(
  page: Page,
  {
    user = null,
    articles = [],
  }: { user?: User | null; articles?: Article[] } = {}
) {
  let saved = articles;

  await page.route(
    (url) =>
      url.pathname === '/auth/session' || url.pathname.startsWith('/api/'),
    (route) => {
      const request = route.request();

      const { pathname } = new URL(request.url());

      if (!user) {
        return route.fulfill({ status: 401, body: 'unauthorized' });
      }

      if (pathname === '/auth/session') {
        return route.fulfill({ json: user });
      }

      if (pathname === '/api/tokens' && request.method() === 'POST') {
        return route.fulfill({
          status: 201,
          json: { token } satisfies CreatedToken,
        });
      }

      if (pathname === '/api/articles' && request.method() === 'GET') {
        return route.fulfill({ json: saved });
      }

      const progress = saved.find(
        (article) => pathname === `/api/articles/${article.article_id}/progress`
      );

      if (progress && request.method() === 'PUT') {
        return route.fulfill({ json: request.postDataJSON() });
      }

      const article = saved.find(
        (article) => pathname === `/api/articles/${article.article_id}`
      );

      if (!article) {
        return route.fulfill({ status: 404, body: 'not found' });
      }

      switch (request.method()) {
        case 'GET':
          return route.fulfill({
            json: { ...article, content } satisfies ArticleWithContent,
          });
        case 'PATCH': {
          const { is_read, ...fields }: UpdateArticle = request.postDataJSON();
          const updated: Article = {
            ...article,
            ...fields,
            date_read:
              is_read === undefined
                ? article.date_read
                : is_read
                  ? '2026-03-12T12:00:00Z'
                  : null,
          };
          saved = saved.map((article) =>
            article.article_id === updated.article_id ? updated : article
          );
          return route.fulfill({ json: updated });
        }
        case 'DELETE':
          saved = saved.filter(
            (other) => other.article_id !== article.article_id
          );
          return route.fulfill({ status: 204 });
        default:
          return route.fulfill({ status: 405 });
      }
    }
  );
}
