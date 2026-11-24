import { describe, expect, test } from 'bun:test';

import { formatDate, formatLength, formatSaved } from './format';

describe('formatSaved', () => {
  test('describes how long ago an article was saved', () => {
    const now = new Date('2026-03-12T15:00:00Z');

    const case_ = (value: string, expected: string) =>
      expect(formatSaved(value, now, 'UTC')).toBe(expected);

    case_('2026-03-12T14:59:30Z', 'Just now');
    case_('2026-03-12T14:15:00Z', '45m');
    case_('2026-03-12T10:00:00Z', '5h');
    case_('2026-03-11T23:00:00Z', 'Yesterday');
    case_('2026-03-09T12:00:00Z', 'Mon');
    case_('2026-01-08T12:00:00Z', 'Jan 8');
    case_('2025-11-12T12:00:00Z', 'Nov 12, 2025');
  });
});

describe('formatDate', () => {
  test('formats a date with the year', () => {
    expect(formatDate('2026-03-04T12:00:00Z', 'UTC')).toBe('Mar 4, 2026');
  });
});

describe('formatLength', () => {
  test('joins the word count and reading time', () => {
    const case_ = (
      words: number | null,
      minutes: number | null,
      expected: string | null
    ) => expect(formatLength(words, minutes)).toBe(expected);

    case_(2840, 12, '2,840 words · 12 min');
    case_(2840, null, '2,840 words');
    case_(null, 12, '12 min');
    case_(null, null, null);
  });
});
