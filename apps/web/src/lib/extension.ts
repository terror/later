const EXTENSION_REDIRECT_HOSTS = [
  '.chromiumapp.org',
  '.extensions.allizom.org',
];

export function parseExtensionRedirect(value: string | null): URL | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol === 'https:' &&
      EXTENSION_REDIRECT_HOSTS.some(
        (suffix) =>
          url.hostname.endsWith(suffix) && url.hostname.length > suffix.length
      )
    ) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}
