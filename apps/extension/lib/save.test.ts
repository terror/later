import { describe, expect, test } from 'bun:test';

import { UnauthorizedError } from './errors';
import { type Status, isSavable, saveStatus } from './save';

describe('isSavable', () => {
  test('accepts http and https URLs', () => {
    const case_ = (url: string | undefined, expected: boolean) =>
      expect(isSavable(url)).toBe(expected);

    case_('https://foo.com/', true);
    case_('http://foo.com/', true);
    case_('chrome://foo', false);
    case_('about:blank', false);
    case_('', false);
    case_(undefined, false);
  });
});

describe('saveStatus', () => {
  test('maps mutation state to status', () => {
    const case_ = (
      mutation: Parameters<typeof saveStatus>[0],
      expected: Status
    ) => expect(saveStatus(mutation)).toEqual(expected);

    case_({ status: 'idle', data: undefined, error: null }, { kind: 'saving' });
    case_(
      { status: 'pending', data: undefined, error: null },
      { kind: 'saving' }
    );
    case_(
      { status: 'success', data: 'foo', error: null },
      { kind: 'saved', title: 'foo' }
    );
    case_(
      { status: 'success', data: null, error: null },
      { kind: 'saved', title: null }
    );
    case_(
      { status: 'error', data: undefined, error: new Error('foo') },
      { kind: 'error', message: 'foo' }
    );
    case_(
      { status: 'error', data: undefined, error: new UnauthorizedError() },
      { kind: 'saving' }
    );
  });
});
