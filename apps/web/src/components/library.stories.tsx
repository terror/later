import type { Article } from '@later/types';
import { useCallback, useState } from 'react';

import {
  articles as fixtures,
  library,
  now,
  user,
} from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { applyUpdate } from '../lib/library';
import { Library } from './library';

function Example({
  articles: initial,
  error = false,
  pageSize,
}: {
  articles: Article[] | null;
  error?: boolean;
  pageSize?: number;
}) {
  const [articles, setArticles] = useState(initial);

  const [loaded, setLoaded] = useState(pageSize ?? Infinity);

  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(() => {
    setLoadingMore(true);

    setTimeout(() => {
      setLoaded((loaded) => loaded + (pageSize ?? 0));
      setLoadingMore(false);
    }, 800);
  }, [pageSize]);

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
      articles={articles?.slice(0, loaded) ?? null}
      error={error}
      hasMore={articles !== null && loaded < articles.length}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      user={user}
      signOutHref='#'
      now={now}
      onToggleFavorite={(article) =>
        update(article, { is_favorited: !article.is_favorited })
      }
      onToggleArchive={(article) =>
        update(article, { is_archived: !article.is_archived })
      }
      onToggleRead={(article) =>
        update(
          article,
          applyUpdate(article, { is_read: article.date_read === null }, now)
        )
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

export const Paginated = meta.story({
  args: { articles: library, pageSize: 10 },
  globals: { viewport: { value: 'laptop', isRotated: false } },
});

export const Empty = meta.story({ args: { articles: [] } });

export const Error = meta.story({ args: { articles: null, error: true } });
