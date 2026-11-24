import type { Article } from '@later/types';
import { describe, expect, test } from 'bun:test';

import {
  crossedEnd,
  readingStatus,
  scrollOffset,
  scrollPosition,
} from './reading';

describe('scrollPosition', () => {
  test.each<[number, number, number]>([
    [0, 400, 0],
    [100, 400, 0.3333],
    [300, 400, 1],
    [350, 400, 1],
    [-10, 400, 0],
    [0, 100, 1],
  ])(
    'returns the fraction scrolled at %p of %p as %p',
    (scrollTop, scrollHeight, expected) => {
      expect(
        scrollPosition({ scrollTop, scrollHeight, clientHeight: 100 })
      ).toBe(expected);
    }
  );
});

describe('scrollOffset', () => {
  test.each<[number, number, number]>([
    [0.5, 400, 150],
    [0.5, 50, 0],
  ])(
    'returns the offset for %p of %p as %p',
    (position, scrollHeight, expected) => {
      expect(scrollOffset(position, { scrollHeight, clientHeight: 100 })).toBe(
        expected
      );
    }
  );
});

describe('crossedEnd', () => {
  test.each<[number, number, boolean]>([
    [0.5, 0.95, true],
    [0.5, 0.6, false],
    [0.95, 1, false],
    [0.95, 0.5, false],
  ])('from %p to %p is %p', (previous, current, expected) => {
    expect(crossedEnd(previous, current)).toBe(expected);
  });
});

describe('readingStatus', () => {
  test.each<[string | null, number, string]>([
    [null, 0, 'Unread'],
    [null, 0.42, '42% read'],
    ['2026-03-04T12:00:00Z', 0.42, 'Read Mar 4, 2026'],
  ])('describes %p at %p as %p', (dateRead, scrollPosition, expected) => {
    expect(
      readingStatus(
        {
          dateRead,
          progress: { scrollPosition, timeSpentSeconds: 0 },
        } as Article,
        'UTC'
      )
    ).toBe(expected);
  });
});
