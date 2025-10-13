import { describe, expect, test } from 'bun:test';

import { cn } from './utils';

describe('cn', () => {
  test('concatenates a basic list of classes', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2');
  });

  test('ignores falsy values and conditional objects', () => {
    expect(
      cn(
        'px-2',
        null,
        undefined,
        false && 'hidden',
        ['text-sm', { 'font-semibold': true }],
        { 'bg-red-500': false, 'text-blue-500': true }
      )
    ).toBe('px-2 text-sm font-semibold text-blue-500');
  });

  test('resolves Tailwind class conflicts by keeping the last occurrence', () => {
    expect(cn('p-2', 'p-4', ['bg-red-500', 'bg-green-500'])).toBe(
      'p-4 bg-green-500'
    );
  });
});
