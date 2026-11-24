import { ReaderView } from '@/components/reader-view';
import { useAuth } from '@/hooks/use-auth';
import { deleteArticle, getArticle, updateArticle } from '@/lib/api';
import type { ArticleWithContent } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ReaderPage() {
  const { user, loading } = useAuth();

  const { articleId } = useParams();

  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleWithContent | null>(null);

  const [error, setError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/sign-in');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !articleId) {
      return;
    }

    getArticle(articleId)
      .then(setArticle)
      .catch((error) => {
        console.error(error);
        setError(true);
      });
  }, [user, articleId]);

  const update = async (fields: {
    is_archived?: boolean;
    is_favorited?: boolean;
  }) => {
    if (!article) {
      return;
    }

    try {
      const updated = await updateArticle(article.article_id, fields);

      setArticle({ ...article, ...updated });
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async () => {
    if (!article) {
      return;
    }

    try {
      await deleteArticle(article.article_id);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ReaderView
      article={article}
      error={error}
      onToggleFavorite={() => update({ is_favorited: !article?.is_favorited })}
      onToggleArchive={() => update({ is_archived: !article?.is_archived })}
      onDelete={remove}
    />
  );
}
