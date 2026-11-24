import { browser, defineBackground } from '#imports';
import { WEB_URL, token } from '@/utils/api';

async function connect() {
  const url = new URL('/connect', WEB_URL);

  url.searchParams.set('redirect_uri', browser.identity.getRedirectURL());

  const redirect = await browser.identity.launchWebAuthFlow({
    url: url.href,
    interactive: true,
  });

  const value = new URLSearchParams(new URL(redirect ?? '').hash.slice(1)).get(
    'token'
  );

  if (!value) {
    throw new Error('connect redirect is missing a token');
  }

  await token.setValue(value);
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (message === 'connect') {
      connect().catch((error) => console.error('failed to connect:', error));
    }
  });
});
