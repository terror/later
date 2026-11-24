import { describe, expect, test } from 'bun:test';

import { UnauthorizedError } from './errors';
import { type Status, isSavable, saveStatus } from './save';

describe('isSavable', () => {
  test.each<[string | undefined, boolean]>([
    ['https://foo.com/', true],
    ['http://foo.com/', true],
    ['chrome://foo', false],
    ['about:blank', false],
    ['', false],
    [undefined, false],
  ])('%p is %p', (url, expected) => {
    expect(isSavable(url)).toBe(expected);
  });
});

describe('saveStatus', () => {
  test.each<[Parameters<typeof saveStatus>[0], Status]>([
    [{ status: 'idle', data: undefined, error: null }, { kind: 'saving' }],
    [{ status: 'pending', data: undefined, error: null }, { kind: 'saving' }],
    [
      { status: 'success', data: 'foo', error: null },
      { kind: 'saved', title: 'foo' },
    ],
    [
      { status: 'success', data: null, error: null },
      { kind: 'saved', title: null },
    ],
    [
      { status: 'error', data: undefined, error: new Error('foo') },
      { kind: 'error', message: 'foo' },
    ],
    [
      { status: 'error', data: undefined, error: new UnauthorizedError() },
      { kind: 'saving' },
    ],
  ])('maps %p to %p', (mutation, expected) => {
    expect(saveStatus(mutation)).toEqual(expected);
  });
});
