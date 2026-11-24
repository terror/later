import { type Page, expect, test } from '@playwright/test';

import { mockApi } from './api';
import { articles, foo, user } from './fixtures';

function header(page: Page) {
  return page.getByRole('banner');
}

test.beforeEach(async ({ page }) => {
  await mockApi(page, { user, articles });
});

test('opens an article from the library', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'foo' }).click();

  await expect(page).toHaveURL(`/read/${foo.article_id}`);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('foo');

  await expect(page.getByRole('article')).toHaveText(
    'example.com · 1 min read foo qux',
    {
      useInnerText: true,
    }
  );
});

test('toggles favorite and archive', async ({ page, baseURL }) => {
  await page.goto(`/read/${foo.article_id}`);

  const favorite = page.waitForRequest(
    (request) => request.method() === 'PATCH'
  );

  await header(page).getByRole('button', { name: 'Favorite' }).click();

  expect((await favorite).url()).toBe(
    `${baseURL}/api/articles/${foo.article_id}`
  );

  expect((await favorite).postDataJSON()).toEqual({ is_favorited: true });

  await expect(
    header(page).getByRole('button', { name: 'Unfavorite' })
  ).toHaveAttribute('aria-pressed', 'true');

  const archive = page.waitForRequest(
    (request) => request.method() === 'PATCH'
  );

  await header(page).getByRole('button', { name: 'Archive' }).click();

  expect((await archive).postDataJSON()).toEqual({ is_archived: true });

  await expect(
    header(page).getByRole('button', { name: 'Unarchive' })
  ).toBeVisible();
});

test('shows an error when the article cannot be loaded', async ({ page }) => {
  await page.goto('/read/foo');

  await expect(page.getByRole('main')).toHaveText(
    'This article couldn’t be loaded. It may have been deleted.',
    { timeout: 15_000, useInnerText: true }
  );
});
