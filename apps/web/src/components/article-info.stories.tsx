import { fn } from 'storybook/test';

import {
  articles,
  failed,
  highlights,
  pending,
  reading,
} from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { ArticleInfo } from './article-info';

const meta = preview.meta({
  component: ArticleInfo,
  args: {
    article: articles[0],
    onToggleFavorite: fn(),
    onToggleArchive: fn(),
    onToggleRead: fn(),
    onDelete: fn(),
  },
  title: 'Patterns/ArticleInfo',
});

export const Default = meta.story({});

export const Favorited = meta.story({ args: { article: articles[1] } });

export const InProgress = meta.story({ args: { article: articles[2] } });

export const Read = meta.story({ args: { article: articles[4] } });

export const WithHighlights = meta.story({
  args: {
    article: reading,
    highlights,
    showRead: false,
    onSelectHighlight: fn(),
  },
});

export const Pending = meta.story({ args: { article: pending } });

export const Failed = meta.story({ args: { article: failed } });
