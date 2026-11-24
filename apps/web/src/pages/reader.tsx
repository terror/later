import { useAuth } from '@/hooks/use-auth';
import { getArticle, updateArticle } from '@/lib/api';
import type { ArticleWithContent } from '@/lib/types';
import { articleSource } from '@/lib/utils';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

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

  const toggleArchived = async () => {
    if (!article) {
      return;
    }

    try {
      const updated = await updateArticle(article.article_id, {
        is_archived: !article.is_archived,
      });

      setArticle({ ...article, ...updated });
    } catch (error) {
      console.error(error);
    }
  };

  const meta = article
    ? [
        article.author,
        articleSource(article),
        article.reading_time_minutes !== null
          ? `${article.reading_time_minutes} min`
          : null,
      ].filter(Boolean)
    : [];

  return (
    <div className='flex min-h-screen flex-col bg-white px-6 pt-10 pb-14 text-neutral-900 antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link
          to='/'
          className='flex h-11 items-center gap-1.5 text-[15px] font-medium text-neutral-500'
        >
          <ArrowLeft className='size-4' aria-hidden />
          Library
        </Link>
        {article && (
          <div className='flex items-center gap-5 text-[15px] font-medium text-neutral-500'>
            <button type='button' onClick={toggleArchived} className='h-11'>
              {article.is_archived ? 'Unarchive' : 'Archive'}
            </button>
            <a
              href={article.url}
              target='_blank'
              rel='noreferrer'
              className='flex h-11 items-center gap-1.5'
            >
              Original
              <ExternalLink className='size-4' aria-hidden />
            </a>
          </div>
        )}
      </header>
      <main className='mx-auto w-full max-w-[680px] py-16'>
        {error ? (
          <p className='text-neutral-500'>
            This article couldn&rsquo;t be loaded.
          </p>
        ) : (
          article && (
            <article
              lang={article.lang ?? undefined}
              dir={article.dir ?? undefined}
            >
              <h1 className='text-4xl leading-[1.1] font-medium tracking-[-0.035em] text-pretty sm:text-5xl'>
                {article.title ?? article.url}
              </h1>
              <p className='mt-5 text-[15px] text-neutral-500'>
                {meta.join(' · ')}
              </p>
              {article.content ? (
                <div
                  className='reader-content mt-12'
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              ) : (
                <p className='mt-12 text-neutral-500'>
                  There&rsquo;s no text saved for this page.{' '}
                  <a href={article.url} className='text-neutral-900 underline'>
                    Read the original
                  </a>
                  .
                </p>
              )}
            </article>
          )
        )}
      </main>
    </div>
  );
}
