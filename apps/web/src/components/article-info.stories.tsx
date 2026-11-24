import { fn } from 'storybook/test';

import { articles } from '../../.storybook/fixtures';
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
