import { ArticleInfo } from '@/components/article-info';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/format';
import type { ArticleWithContent } from '@/lib/types';
import { articleSource, cn } from '@/lib/utils';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ExternalLink,
  PanelRight,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ReaderView({
  article,
  error = false,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: {
  article: ArticleWithContent | null;
  error?: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const [infoOpen, setInfoOpen] = useState(true);

  const byline = article
    ? [
        article.author,
        article.publication_date && formatDate(article.publication_date),
      ].filter(Boolean)
    : [];

  return (
    <div className='bg-background text-foreground flex h-dvh flex-col'>
      <header className='flex h-14 shrink-0 items-center gap-3 px-3 md:px-4'>
        <Button asChild variant='ghost'>
          <Link to='/'>
            <ArrowLeft />
            Library
          </Link>
        </Button>
        <span className='text-muted-foreground flex-1 truncate text-center text-[13px] max-md:invisible'>
          {article?.title}
        </span>
        {article && (
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={article.is_favorited ? 'Unfavorite' : 'Favorite'}
              aria-pressed={article.is_favorited}
              title={article.is_favorited ? 'Unfavorite' : 'Favorite'}
              onClick={onToggleFavorite}
            >
              <Star className={cn(article.is_favorited && 'fill-current')} />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={article.is_archived ? 'Unarchive' : 'Archive'}
              title={article.is_archived ? 'Unarchive' : 'Archive'}
              onClick={onToggleArchive}
            >
              {article.is_archived ? <ArchiveRestore /> : <Archive />}
            </Button>
            <Button asChild variant='ghost' size='icon'>
              <a
                href={article.url}
                target='_blank'
                rel='noreferrer'
                aria-label='Open original'
                title='Open original'
              >
                <ExternalLink />
              </a>
            </Button>
            <Button
              variant={infoOpen ? 'secondary' : 'ghost'}
              size='icon'
              className='hidden xl:inline-flex'
              aria-label='Details'
              aria-pressed={infoOpen}
              title='Details'
              onClick={() => setInfoOpen(!infoOpen)}
            >
              <PanelRight />
            </Button>
          </div>
        )}
      </header>
      <div className='flex min-h-0 flex-1'>
        <main className='min-w-0 flex-1 overflow-y-auto px-6 pt-8 pb-24 md:px-8 md:pt-12'>
          {error ? (
            <EmptyState
              title='This article couldn’t be loaded.'
              description='It may have been deleted.'
            />
          ) : (
            article && (
              <article
                lang={article.lang ?? undefined}
                dir={article.dir ?? undefined}
                className='mx-auto max-w-[660px]'
              >
                <p className='text-muted-foreground text-[13px]'>
                  {articleSource(article)}
                  {article.reading_time_minutes !== null &&
                    ` · ${article.reading_time_minutes} min read`}
                </p>
                <h1 className='mt-3.5 text-[32px] leading-[1.1] font-semibold tracking-[-0.04em] text-balance md:text-[40px]'>
                  {article.title ?? article.url}
                </h1>
                {byline.length > 0 && (
                  <p className='text-muted-foreground mt-4 text-[15px]'>
                    {byline.join(' · ')}
                  </p>
                )}
                {article.content ? (
                  <div
                    className='reader-content mt-10'
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                ) : (
                  <p className='text-muted-foreground mt-10'>
                    There&rsquo;s no text saved for this page.{' '}
                    <a href={article.url} className='text-foreground underline'>
                      Read the original
                    </a>
                    .
                  </p>
                )}
              </article>
            )
          )}
        </main>
        {article && infoOpen && (
          <ArticleInfo
            className='hidden xl:flex'
            article={article}
            showRead={false}
            onToggleFavorite={onToggleFavorite}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
