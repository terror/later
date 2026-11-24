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
    highlightId: 'foo',
    articleId: 'bar',
    selectedText: 'baz',
    contextBefore: null,
    contextAfter: null,
    startOffset: 0,
    endOffset: 3,
    color: '#FFEB3B',
    note: null,
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
    ...fields,
  };
}

const highlights = [
  highlight({ highlightId: 'a', startOffset: 0, endOffset: 3 }),
  highlight({ highlightId: 'b', startOffset: 4, endOffset: 7 }),
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
  ])('inserts %i..%i in order', (startOffset, endOffset, expected) => {
    expect(
      insertHighlight(
        highlights,
        highlight({ highlightId: 'c', startOffset, endOffset })
      ).map(({ highlightId }) => highlightId)
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
        [highlight({ highlightId: 'a', note: 'bar' }), highlights[1]],
        'a',
        update
      )
    ).toEqual([highlight({ highlightId: 'a', ...expected }), highlights[1]]);
  });
});

describe('removeHighlight', () => {
  test('removes the highlight', () => {
    expect(removeHighlight(highlights, 'a')).toEqual([highlights[1]]);
  });
});

describe('selectionRange', () => {
  test.each([
    [[0, 1, 0, 3], { startOffset: 1, endOffset: 3, selectedText: 'oo' }],
    [[3, 1, 5, 2], { startOffset: 9, endOffset: 16, selectedText: 'az 😀qu' }],
    [[1, 0, 2, 1], { startOffset: 3, endOffset: 5, selectedText: ' b' }],
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
      startOffset: 4,
      endOffset: 7,
      selectedText: 'bar',
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
      ranges.map(([startOffset, endOffset], index) =>
        highlight({
          highlightId: 'ab'[index],
          startOffset,
          endOffset,
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
