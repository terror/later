import { useState } from 'react';
import { fn } from 'storybook/test';

import { highlights, now, reading, resumed } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import {
  DEFAULT_HIGHLIGHT_COLOR,
  insertHighlight,
  patchHighlight,
  removeHighlight,
} from '../lib/highlights';
import { applyUpdate } from '../lib/library';
import { ReaderView } from './reader-view';

const meta = preview.meta({
  component: ReaderView,
  args: {
    article: reading,
    onToggleFavorite: fn(),
    onToggleArchive: fn(),
    onToggleRead: fn(),
    onProgress: fn(),
    onDelete: fn(),
    highlights: [],
    onCreateHighlight: fn(),
    onUpdateHighlight: fn(),
    onDeleteHighlight: fn(),
  },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [article, setArticle] = useState(args.article);

    const [highlights, setHighlights] = useState(args.highlights);

    return (
      <ReaderView
        {...args}
        article={article}
        highlights={highlights}
        onCreateHighlight={(range) => {
          args.onCreateHighlight(range);
          setHighlights((highlights) =>
            insertHighlight(highlights, {
              ...range,
              highlightId: crypto.randomUUID(),
              articleId: reading.articleId,
              contextBefore: null,
              contextAfter: null,
              color: DEFAULT_HIGHLIGHT_COLOR,
              note: null,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            })
          );
        }}
        onUpdateHighlight={(highlightId, update) => {
          args.onUpdateHighlight(highlightId, update);
          setHighlights((highlights) =>
            patchHighlight(highlights, highlightId, update)
          );
        }}
        onDeleteHighlight={(highlightId) => {
          args.onDeleteHighlight(highlightId);
          setHighlights((highlights) =>
            removeHighlight(highlights, highlightId)
          );
        }}
        onToggleRead={() => {
          args.onToggleRead();
          setArticle(
            (article) =>
              article &&
              applyUpdate(article, { isRead: article.dateRead === null }, now)
          );
        }}
        onProgress={(scrollPosition) => {
          args.onProgress(scrollPosition);
          setArticle(
            (article) =>
              article && {
                ...article,
                progress: { ...article.progress, scrollPosition },
              }
          );
        }}
      />
    );
  },
  title: 'Patterns/Reader',
});

export const Default = meta.story({
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const Resumed = meta.story({
  args: { article: resumed },
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const Read = meta.story({
  args: { article: { ...reading, dateRead: '2026-03-12T14:00:00Z' } },
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const WithHighlights = meta.story({
  args: { highlights },
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const WithoutText = meta.story({
  args: { article: { ...reading, content: null } },
});

export const Error = meta.story({ args: { article: null, error: true } });
