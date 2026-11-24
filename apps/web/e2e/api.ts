import type { Page } from '@playwright/test';

import type { Article, Provider, User } from '../src/lib/types';
import { content, token } from './fixtures';

export async function mockApi(
  page: Page,
  {
    user = null,
    articles = [],
    providers = ['github'],
  }: { user?: User | null; articles?: Article[]; providers?: Provider[] } = {}
) {
  let saved = articles;

  await page.route(
    (url) =>
      url.pathname === '/auth/session' ||
      url.pathname === '/auth/providers' ||
      url.pathname.startsWith('/api/'),
    (route) => {
      const request = route.request();

      const { pathname } = new URL(request.url());

      if (pathname === '/auth/providers') {
        return route.fulfill({ json: providers });
      }

      if (!user) {
        return route.fulfill({ status: 401, body: 'unauthorized' });
      }

      if (pathname === '/auth/session') {
        return route.fulfill({ json: user });
      }

      if (pathname === '/api/tokens' && request.method() === 'POST') {
        return route.fulfill({ status: 201, json: { token } });
      }

      if (pathname === '/api/articles' && request.method() === 'GET') {
        return route.fulfill({ json: saved });
      }

      const article = saved.find(
        (article) => pathname === `/api/articles/${article.article_id}`
      );

      if (!article) {
        return route.fulfill({ status: 404, body: 'not found' });
      }

      switch (request.method()) {
        case 'GET':
          return route.fulfill({ json: { ...article, content } });
        case 'PATCH': {
          const updated = { ...article, ...request.postDataJSON() };
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
