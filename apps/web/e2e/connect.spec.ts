import { expect, test } from '@playwright/test';

import { mockApi } from './api';
import { token, user } from './fixtures';

test('hands a token to the extension', async ({ page }) => {
  await mockApi(page, { user });

  await page.route('https://foo.chromiumapp.org/', (route) =>
    route.fulfill({ body: '' })
  );

  await page.goto(
    `/connect?redirect_uri=${encodeURIComponent('https://foo.chromiumapp.org/')}`
  );

  await expect(page.getByText('Signed in as foo@example.com.')).toBeVisible();

  await page.getByRole('button', { name: 'Connect' }).click();

  await expect(page).toHaveURL(`https://foo.chromiumapp.org/#token=${token}`);
});
