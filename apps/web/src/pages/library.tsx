import {
  deleteArticle,
  getArticles,
  getLogoutUrl,
  updateArticle,
} from '@/lib/api';
import type { Article } from '@/lib/types';
import { articleSource, cn } from '@/lib/utils';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type View = 'inbox' | 'archive';

export default function LibraryPage() {
  const [articles, setArticles] = useState<Article[] | null>(null);

  const [error, setError] = useState(false);

  const [view, setView] = useState<View>('inbox');

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch((error) => {
        console.error(error);
        setError(true);
      });
  }, []);

  const toggleArchived = async (article: Article) => {
    try {
      const updated = await updateArticle(article.article_id, {
        is_archived: !article.is_archived,
      });

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

  const visible = articles?.filter(
    (article) => article.is_archived === (view === 'archive')
  );

  return (
    <div className='flex min-h-screen flex-col bg-white px-6 pt-10 pb-14 text-neutral-900 antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link
          to='/'
          className='text-[22px] leading-none font-semibold tracking-[-0.035em]'
        >
          later
        </Link>
        <a
          href={getLogoutUrl()}
          className='flex h-11 items-center text-[15px] font-medium text-neutral-500'
        >
          Sign out
        </a>
      </header>
      <main className='mx-auto w-full max-w-2xl py-16'>
        <nav className='flex gap-6 text-[15px] font-medium'>
          {(['inbox', 'archive'] as const).map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => setView(option)}
              className={cn(
                'h-11 capitalize',
                view === option ? 'text-neutral-900' : 'text-neutral-400'
              )}
            >
              {option}
            </button>
          ))}
        </nav>
        {error ? (
          <p className='mt-10 text-neutral-500'>
            Your articles couldn&rsquo;t be loaded. Try again later.
          </p>
        ) : visible?.length === 0 ? (
          <div className='mt-10'>
            <p className='text-2xl font-medium tracking-[-0.03em]'>
              {view === 'inbox' ? 'Nothing to read yet.' : 'Nothing archived.'}
            </p>
            {view === 'inbox' && (
              <p className='mt-2 text-neutral-500'>
                Save pages with the later browser extension.
              </p>
            )}
          </div>
        ) : (
          <ul className='mt-6 divide-y divide-neutral-100'>
            {visible?.map((article) => (
              <li
                key={article.article_id}
                className='group flex items-start justify-between gap-4 py-5'
              >
                <Link
                  to={`/read/${article.article_id}`}
                  className='min-w-0 flex-1'
                >
                  <p className='text-[17px] leading-snug font-medium tracking-[-0.01em] text-pretty'>
                    {article.title ?? article.url}
                  </p>
                  <p className='mt-1 truncate text-sm text-neutral-500'>
                    {articleSource(article)}
                    {article.reading_time_minutes !== null &&
                      ` · ${article.reading_time_minutes} min`}
                  </p>
                </Link>
                <div className='flex shrink-0 gap-1 text-neutral-400'>
                  <button
                    type='button'
                    onClick={() => toggleArchived(article)}
                    aria-label={article.is_archived ? 'Unarchive' : 'Archive'}
                    title={article.is_archived ? 'Unarchive' : 'Archive'}
                    className='flex size-9 items-center justify-center rounded-lg hover:bg-neutral-100 hover:text-neutral-900'
                  >
                    {article.is_archived ? (
                      <ArchiveRestore className='size-4' aria-hidden />
                    ) : (
                      <Archive className='size-4' aria-hidden />
                    )}
                  </button>
                  <button
                    type='button'
                    onClick={() => remove(article)}
                    aria-label='Delete'
                    title='Delete'
                    className='flex size-9 items-center justify-center rounded-lg hover:bg-neutral-100 hover:text-neutral-900'
                  >
                    <Trash2 className='size-4' aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
