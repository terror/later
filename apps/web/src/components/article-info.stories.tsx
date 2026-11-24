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
    onDelete: fn(),
  },
  title: 'Patterns/ArticleInfo',
});

export const Default = meta.story({});

export const Favorited = meta.story({ args: { article: articles[1] } });
