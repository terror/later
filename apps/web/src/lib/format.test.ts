import { describe, expect, test } from 'bun:test';

import {
  formatDate,
  formatLength,
  formatSaved,
  formatTimeSpent,
} from './format';

describe('formatSaved', () => {
  const now = new Date('2026-03-12T15:00:00Z');

  test.each<[string, string]>([
    ['2026-03-12T14:59:30Z', 'Just now'],
    ['2026-03-12T14:15:00Z', '45m'],
    ['2026-03-12T10:00:00Z', '5h'],
    ['2026-03-11T23:00:00Z', 'Yesterday'],
    ['2026-03-09T12:00:00Z', 'Mon'],
    ['2026-01-08T12:00:00Z', 'Jan 8'],
    ['2025-11-12T12:00:00Z', 'Nov 12, 2025'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatSaved(value, now, 'UTC')).toBe(expected);
  });
});

describe('formatDate', () => {
  test('formats a date with the year', () => {
    expect(formatDate('2026-03-04T12:00:00Z', 'UTC')).toBe('Mar 4, 2026');
  });
});

describe('formatLength', () => {
  test.each<[number | null, number | null, string | null]>([
    [2840, 12, '2,840 words · 12 min'],
    [2840, null, '2,840 words'],
    [null, 12, '12 min'],
    [null, null, null],
  ])('formats %p words and %p minutes as %p', (words, minutes, expected) => {
    expect(formatLength(words, minutes)).toBe(expected);
  });
});

describe('formatTimeSpent', () => {
  test.each<[number, string | null]>([
    [0, null],
    [10, '1 min spent'],
    [190, '3 min spent'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatTimeSpent(seconds)).toBe(expected);
  });
});
