import { Library } from '@/components/library';
import { useAuth } from '@/hooks/use-auth';
import {
  deleteArticle,
  getArticles,
  getLogoutUrl,
  updateArticle,
} from '@/lib/api';
import type { Article } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function LibraryPage() {
  const { user } = useAuth();

  const [articles, setArticles] = useState<Article[] | null>(null);

  const [error, setError] = useState(false);

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch((error) => {
        console.error(error);
        setError(true);
      });
  }, []);

  const update = async (
    article: Article,
    fields: { is_archived?: boolean; is_favorited?: boolean }
  ) => {
    try {
      const updated = await updateArticle(article.article_id, fields);

      setArticles(
        (articles) =>
          articles?.map((article) =>
            article.article_id === updated.article_id ? updated : article
          ) ?? null
      );
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async (article: Article) => {
    try {
      await deleteArticle(article.article_id);

      setArticles(
        (articles) =>
          articles?.filter(
            ({ article_id }) => article_id !== article.article_id
          ) ?? null
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Library
      articles={articles}
      error={error}
      user={user}
      signOutHref={getLogoutUrl()}
      onToggleFavorite={(article) =>
        update(article, { is_favorited: !article.is_favorited })
      }
      onToggleArchive={(article) =>
        update(article, { is_archived: !article.is_archived })
      }
      onDelete={remove}
    />
  );
}
