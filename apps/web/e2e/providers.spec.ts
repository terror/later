import { expect, test } from '@playwright/test';

import { mockApi } from './api';

const connect = `/connect?redirect_uri=${encodeURIComponent('https://foo.chromiumapp.org/')}`;

for (const { path, count } of [
  { path: '/', count: 2 },
  { path: '/sign-in', count: 1 },
  { path: connect, count: 1 },
]) {
  test(`links to Google sign in on ${path}`, async ({ page, baseURL }) => {
    await mockApi(page, { providers: ['github', 'google'] });

    await page.goto(path);

    const href = `/auth/google/login?redirect=${encodeURIComponent(`${baseURL}${path}`)}`;

    expect(
      await page
        .getByRole('link', { name: 'Continue with Google' })
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    ).toEqual(Array(count).fill(href));
  });
}
