import { type Page, expect, test } from '@playwright/test';

import { mockApi } from './api';
import { articles, foo, now, user } from './fixtures';

function rows(page: Page) {
  return page.getByRole('main').getByRole('listitem');
}

function details(page: Page) {
  return page.getByRole('complementary', { name: 'Article details' });
}

function nav(page: Page) {
  return page.getByRole('navigation', { name: 'Library' });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(now);
  await mockApi(page, { user, articles });
  await page.goto('/');
});

test('lists articles in the inbox', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inbox 2');

  await expect(rows(page)).toHaveText(
    ['E foo 1h example.com · 1 min', 'E bar Yesterday example.com · 1 min'],
    {
      useInnerText: true,
    }
  );
});

test('switches between views', async ({ page }) => {
  await nav(page).getByRole('button', { name: 'Favorites' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Favorites 1'
  );

  await expect(rows(page)).toHaveText(['E bar Yesterday example.com · 1 min'], {
    useInnerText: true,
  });

  await nav(page).getByRole('button', { name: 'Archive' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Archive 1');

  await expect(rows(page)).toHaveText(['E baz Mar 1 example.com · 1 min'], {
    useInnerText: true,
  });

  await nav(page).getByRole('button', { name: 'Inbox' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inbox 2');
});

test('searches with the / shortcut', async ({ page }) => {
  await expect(rows(page)).toHaveCount(2);

  await page.keyboard.press('/');

  await expect(
    page.getByRole('searchbox', { name: 'Search articles' })
  ).toBeFocused();

  await page.keyboard.type('foo');

  await expect(rows(page)).toHaveText(['E foo 1h example.com · 1 min'], {
    useInnerText: true,
  });

  await page.keyboard.type('bar');

  await expect(page.getByText('No matches for “foobar”.')).toBeVisible();
});

test('sorts by date', async ({ page }) => {
  await page.getByRole('button', { name: 'Newest' }).click();

  await expect(page.getByRole('button', { name: 'Oldest' })).toBeVisible();

  await expect(rows(page)).toHaveText(
    ['E bar Yesterday example.com · 1 min', 'E foo 1h example.com · 1 min'],
    {
      useInnerText: true,
    }
  );
});

test('favorites from the info panel', async ({ page, baseURL }) => {
  const request = page.waitForRequest(
    (request) => request.method() === 'PATCH'
  );

  await details(page).getByRole('button', { name: 'Favorite' }).click();

  expect((await request).url()).toBe(
    `${baseURL}/api/articles/${foo.article_id}`
  );

  expect((await request).postDataJSON()).toEqual({ is_favorited: true });

  await expect(
    details(page).getByRole('button', { name: 'Unfavorite' })
  ).toHaveAttribute('aria-pressed', 'true');

  await expect(nav(page).getByRole('button', { name: 'Favorites' })).toHaveText(
    'Favorites2'
  );
});

test('archives from the info panel', async ({ page, baseURL }) => {
  const request = page.waitForRequest(
    (request) => request.method() === 'PATCH'
  );

  await details(page).getByRole('button', { name: 'Archive' }).click();

  expect((await request).url()).toBe(
    `${baseURL}/api/articles/${foo.article_id}`
  );

  expect((await request).postDataJSON()).toEqual({ is_archived: true });

  await expect(rows(page)).toHaveText(['E bar Yesterday example.com · 1 min'], {
    useInnerText: true,
  });

  await expect(details(page).getByRole('heading')).toHaveText('bar');
});

test('deletes from the info panel', async ({ page, baseURL }) => {
  const request = page.waitForRequest(
    (request) => request.method() === 'DELETE'
  );

  await details(page).getByRole('button', { name: 'Delete' }).click();

  expect((await request).url()).toBe(
    `${baseURL}/api/articles/${foo.article_id}`
  );

  await expect(rows(page)).toHaveText(['E bar Yesterday example.com · 1 min'], {
    useInnerText: true,
  });

  await expect(nav(page).getByRole('button', { name: 'Inbox' })).toHaveText(
    'Inbox1'
  );
});
