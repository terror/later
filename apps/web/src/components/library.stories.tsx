import { useState } from 'react';

import { articles as fixtures, now, user } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import type { Article } from '../lib/types';
import { Library } from './library';

function Example({
  articles: initial,
  error = false,
}: {
  articles: Article[] | null;
  error?: boolean;
}) {
  const [articles, setArticles] = useState(initial);

  const update = (article: Article, fields: Partial<Article>) =>
    setArticles(
      (articles) =>
        articles?.map((other) =>
          other.article_id === article.article_id
            ? { ...other, ...fields }
            : other
        ) ?? null
    );

  return (
    <Library
      articles={articles}
      error={error}
      user={user}
      signOutHref='#'
      now={now}
      onToggleFavorite={(article) =>
        update(article, { is_favorited: !article.is_favorited })
      }
      onToggleArchive={(article) =>
        update(article, { is_archived: !article.is_archived })
      }
      onDelete={(article) =>
        setArticles(
          (articles) =>
            articles?.filter(
              ({ article_id }) => article_id !== article.article_id
            ) ?? null
        )
      }
    />
  );
}

const meta = preview.meta({
  component: Example,
  args: { articles: fixtures },
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/Library',
});

export const Default = meta.story({
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const Phone = meta.story({
  globals: { theme: 'dark', viewport: { value: 'phone', isRotated: false } },
});

export const Empty = meta.story({ args: { articles: [] } });

export const Error = meta.story({ args: { articles: null, error: true } });
