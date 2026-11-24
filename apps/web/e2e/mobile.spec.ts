import { expect, test } from '@playwright/test';

import { mockApi } from './api';
import { articles, user } from './fixtures';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test('uses the mobile layout on a phone', async ({ page }) => {
  await mockApi(page, { user, articles });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Inbox 2');

  await expect(page.getByRole('navigation', { name: 'Library' })).toBeHidden();

  await expect(
    page.getByRole('complementary', { name: 'Article details' })
  ).toBeHidden();

  await expect(page.getByRole('button', { name: 'Newest' })).toBeHidden();

  await expect(page.getByRole('link', { name: 'Sign out' })).toBeVisible();

  const tabs = page.getByRole('tablist', { name: 'Library' });

  await tabs.getByRole('tab', { name: 'Favorites' }).tap();

  await expect(tabs.getByRole('tab', { selected: true })).toHaveText(
    'Favorites'
  );

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Favorites 1'
  );
});
