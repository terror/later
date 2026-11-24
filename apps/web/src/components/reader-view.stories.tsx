import { useState } from 'react';
import { fn } from 'storybook/test';

import { now, reading, resumed } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
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
  },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [article, setArticle] = useState(args.article);

    return (
      <ReaderView
        {...args}
        article={article}
        onToggleRead={() => {
          args.onToggleRead();
          setArticle(
            (article) =>
              article &&
              applyUpdate(article, { is_read: article.date_read === null }, now)
          );
        }}
        onProgress={(scroll_position) => {
          args.onProgress(scroll_position);
          setArticle(
            (article) =>
              article && {
                ...article,
                progress: { ...article.progress, scroll_position },
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
  args: { article: { ...reading, date_read: '2026-03-12T14:00:00Z' } },
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const WithoutText = meta.story({
  args: { article: { ...reading, content: null } },
});

export const Error = meta.story({ args: { article: null, error: true } });
