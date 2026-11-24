import type { CreateHighlight, Highlight, UpdateHighlight } from '@later/types';

export const DEFAULT_HIGHLIGHT_COLOR = '#FFEB3B';

function compareHighlights(a: Highlight, b: Highlight): number {
  return a.start_offset - b.start_offset || a.end_offset - b.end_offset;
}

export function insertHighlight(
  highlights: Highlight[],
  highlight: Highlight
): Highlight[] {
  return [...highlights, highlight].toSorted(compareHighlights);
}

export function patchHighlight(
  highlights: Highlight[],
  highlightId: string,
  update: UpdateHighlight
): Highlight[] {
  return highlights.map((highlight) =>
    highlight.highlight_id === highlightId
      ? {
          ...highlight,
          ...update,
          note:
            update.note === undefined ? highlight.note : update.note || null,
        }
      : highlight
  );
}

export function removeHighlight(
  highlights: Highlight[],
  highlightId: string
): Highlight[] {
  return highlights.filter(
    (highlight) => highlight.highlight_id !== highlightId
  );
}

function textNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  return nodes;
}

function textOffset(root: Node, container: Node, offset: number): number {
  const range = document.createRange();

  range.setStart(root, 0);
  range.setEnd(container, offset);

  return range.toString().length;
}

export function selectionRange(
  root: Node,
  range: Range
): CreateHighlight | null {
  if (
    range.collapsed ||
    !root.contains(range.startContainer) ||
    !root.contains(range.endContainer)
  ) {
    return null;
  }

  const start_offset = textOffset(
    root,
    range.startContainer,
    range.startOffset
  );

  const end_offset = textOffset(root, range.endContainer, range.endOffset);

  const selected_text = (root.textContent ?? '').slice(
    start_offset,
    end_offset
  );

  return selected_text.trim() === ''
    ? null
    : { start_offset, end_offset, selected_text };
}

export function renderHighlights(root: Element, highlights: Highlight[]) {
  for (const highlight of highlights) {
    let offset = 0;

    for (const node of textNodes(root)) {
      const start = Math.max(highlight.start_offset - offset, 0);

      const end = Math.min(highlight.end_offset - offset, node.length);

      offset += node.length;

      if (start >= end) {
        continue;
      }

      const range = document.createRange();

      range.setStart(node, start);
      range.setEnd(node, end);

      const mark = document.createElement('mark');

      mark.dataset.highlightId = highlight.highlight_id;
      mark.style.setProperty('--highlight', highlight.color);

      range.surroundContents(mark);
    }
  }
}
