import { describe, expect, test } from 'bun:test';

import {
  crossedEnd,
  readingStatus,
  scrollOffset,
  scrollPosition,
} from './reading';
import type { Article } from './types';

describe('scrollPosition', () => {
  test('returns the fraction scrolled', () => {
    const case_ = (scrollTop: number, scrollHeight: number, expected: number) =>
      expect(
        scrollPosition({ scrollTop, scrollHeight, clientHeight: 100 })
      ).toBe(expected);

    case_(0, 400, 0);
    case_(100, 400, 0.3333);
    case_(300, 400, 1);
    case_(350, 400, 1);
    case_(-10, 400, 0);
    case_(0, 100, 1);
  });
});

describe('scrollOffset', () => {
  test('returns the offset for a position', () => {
    const case_ = (position: number, scrollHeight: number, expected: number) =>
      expect(scrollOffset(position, { scrollHeight, clientHeight: 100 })).toBe(
        expected
      );

    case_(0.5, 400, 150);
    case_(0.5, 50, 0);
  });
});

describe('crossedEnd', () => {
  test('detects scrolling past the end threshold', () => {
    const case_ = (previous: number, current: number, expected: boolean) =>
      expect(crossedEnd(previous, current)).toBe(expected);

    case_(0.5, 0.95, true);
    case_(0.5, 0.6, false);
    case_(0.95, 1, false);
    case_(0.95, 0.5, false);
  });
});

describe('readingStatus', () => {
  test('describes read state and progress', () => {
    const case_ = (
      date_read: string | null,
      scroll_position: number,
      expected: string
    ) =>
      expect(
        readingStatus(
          {
            date_read,
            progress: { scroll_position, time_spent_seconds: 0 },
          } as Article,
          'UTC'
        )
      ).toBe(expected);

    case_(null, 0, 'Unread');
    case_(null, 0.42, '42% read');
    case_('2026-03-04T12:00:00Z', 0.42, 'Read Mar 4, 2026');
  });
});
