import { expect, test } from '@playwright/test';

import { mockApi } from './api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('shows the landing page when signed out', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'later saves the articles you find and keeps them until you’re ready to read.'
  );

});

test('links to the sign in page', async ({ page, baseURL }) => {
  await page.goto('/');

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Sign in' })
    .click();

  await expect(page).toHaveURL('/sign-in');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Sign in to keep reading.'
  );

  await expect(
    page.getByRole('link', { name: 'Continue with GitHub' })
  ).toHaveAttribute(
    'href',
    `/auth/login?redirect=${encodeURIComponent(`${baseURL}/sign-in`)}`
  );
});
