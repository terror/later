import { describe, expect, test } from 'bun:test';

import { parseExtensionRedirect } from './extension';

describe('parseExtensionRedirect', () => {
  test('accepts extension redirect URLs', () => {
    expect(parseExtensionRedirect('https://foo.chromiumapp.org/')?.href).toBe(
      'https://foo.chromiumapp.org/'
    );

    expect(
      parseExtensionRedirect('https://foo.extensions.allizom.org/bar')?.href
    ).toBe('https://foo.extensions.allizom.org/bar');
  });

  test('rejects other URLs', () => {
    for (const value of [
      null,
      '',
      'foo',
      'http://foo.chromiumapp.org/',
      'https://chromiumapp.org/',
      'https://.chromiumapp.org/',
      'https://foo.chromiumapp.org.bar.com/',
      'https://foochromiumapp.org/',
      'https://foo.com/?bar=.chromiumapp.org',
    ]) {
      expect(parseExtensionRedirect(value)).toBeNull();
    }
  });
});
