import type { Highlight } from '@later/types';
import { describe, expect, test } from 'bun:test';

import {
  insertHighlight,
  patchHighlight,
  removeHighlight,
  renderHighlights,
  selectionRange,
} from './highlights';

function highlight(fields: Partial<Highlight>): Highlight {
  return {
    highlight_id: 'foo',
    article_id: 'bar',
    selected_text: 'baz',
    context_before: null,
    context_after: null,
    start_offset: 0,
    end_offset: 3,
    color: '#FFEB3B',
    note: null,
    created_at: '2026-03-12T00:00:00Z',
    updated_at: '2026-03-12T00:00:00Z',
    ...fields,
  };
}

const highlights = [
  highlight({ highlight_id: 'a', start_offset: 0, end_offset: 3 }),
  highlight({ highlight_id: 'b', start_offset: 4, end_offset: 7 }),
];

function root(html: string): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = html;
  return element;
}

describe('insertHighlight', () => {
  test.each([
    [0, 1, ['c', 'a', 'b']],
    [0, 5, ['a', 'c', 'b']],
    [5, 6, ['a', 'b', 'c']],
  ])('inserts %i..%i in order', (start_offset, end_offset, expected) => {
    expect(
      insertHighlight(
        highlights,
        highlight({ highlight_id: 'c', start_offset, end_offset })
      ).map(({ highlight_id }) => highlight_id)
    ).toEqual(expected);
  });
});

describe('patchHighlight', () => {
  test.each([
    [{ note: 'foo' }, { color: '#FFEB3B', note: 'foo' }],
    [{ note: '' }, { color: '#FFEB3B', note: null }],
    [{ color: '#000000' }, { color: '#000000', note: 'bar' }],
  ])('patches %o', (update, expected) => {
    expect(
      patchHighlight(
        [highlight({ highlight_id: 'a', note: 'bar' }), highlights[1]],
        'a',
        update
      )
    ).toEqual([highlight({ highlight_id: 'a', ...expected }), highlights[1]]);
  });
});

describe('removeHighlight', () => {
  test('removes the highlight', () => {
    expect(removeHighlight(highlights, 'a')).toEqual([highlights[1]]);
  });
});

describe('selectionRange', () => {
  test.each([
    [[0, 1, 0, 3], { start_offset: 1, end_offset: 3, selected_text: 'oo' }],
    [
      [3, 1, 5, 2],
      { start_offset: 9, end_offset: 16, selected_text: 'az 😀qu' },
    ],
    [[1, 0, 2, 1], { start_offset: 3, end_offset: 5, selected_text: ' b' }],
    [[0, 1, 0, 1], null],
    [[1, 0, 1, 1], null],
  ])('selects %j', ([start, startOffset, end, endOffset], expected) => {
    const element = root('<p>foo</p> <p>bar <b>baz</b> 😀<i>qux</i></p>');

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

    const nodes: Node[] = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    const range = document.createRange();

    range.setStart(nodes[start], startOffset);
    range.setEnd(nodes[end], endOffset);

    expect(selectionRange(element, range)).toEqual(expected);
  });

  test('counts element boundaries', () => {
    const element = root('<p>foo <b>bar</b></p>');

    const range = document.createRange();

    range.selectNodeContents(element.querySelector('b')!);

    expect(selectionRange(element, range)).toEqual({
      start_offset: 4,
      end_offset: 7,
      selected_text: 'bar',
    });
  });

  test('ignores ranges outside the root', () => {
    const element = root('<p>foo</p>');

    const range = document.createRange();

    range.selectNodeContents(document.createTextNode('bar'));

    expect(selectionRange(element, range)).toBeNull();
  });
});

describe('renderHighlights', () => {
  test.each([
    [[[1, 3]], '<p>f<mark data-highlight-id="a">oo</mark></p><p>bar</p>'],
    [
      [[2, 4]],
      '<p>fo<mark data-highlight-id="a">o</mark></p><p><mark data-highlight-id="a">b</mark>ar</p>',
    ],
    [
      [
        [0, 2],
        [1, 3],
      ],
      '<p><mark data-highlight-id="a">f<mark data-highlight-id="b">o</mark></mark><mark data-highlight-id="b">o</mark></p><p>bar</p>',
    ],
  ])('renders %j', (ranges, expected) => {
    const element = root('<p>foo</p><p>bar</p>');

    renderHighlights(
      element,
      ranges.map(([start_offset, end_offset], index) =>
        highlight({
          highlight_id: 'ab'[index],
          start_offset,
          end_offset,
        })
      )
    );

    element
      .querySelectorAll('mark')
      .forEach((mark) => mark.removeAttribute('style'));

    expect(element.innerHTML).toBe(expected);
    expect(element.textContent).toBe('foobar');
  });
});
