import { ArticleContent } from '@/components/article-content';
import { ArticleInfo } from '@/components/article-info';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/format';
import { crossedEnd, scrollOffset, scrollPosition } from '@/lib/reading';
import { articleSource, cn } from '@/lib/utils';
import type {
  ArticleWithContent,
  CreateHighlight,
  Highlight,
  UpdateHighlight,
} from '@later/types';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Circle,
  CircleCheck,
  ExternalLink,
  PanelRight,
  Star,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const PROGRESS_DEBOUNCE_MS = 1000;

export function ReaderView({
  article,
  error = false,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onProgress,
  onDelete,
  highlights,
  onCreateHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: {
  article: ArticleWithContent | null;
  error?: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onToggleRead: () => void;
  onProgress: (scrollPosition: number) => void;
  onDelete: () => void;
  highlights: Highlight[];
  onCreateHighlight: (range: CreateHighlight) => void;
  onUpdateHighlight: (highlightId: string, update: UpdateHighlight) => void;
  onDeleteHighlight: (highlightId: string) => void;
}) {
  const [infoOpen, setInfoOpen] = useState(true);

  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null
  );

  const main = useRef<HTMLElement>(null);

  const onProgressRef = useRef(onProgress);

  const tracking = useRef({
    articleId: null as string | null,
    markedRead: false,
    position: 0,
    timer: null as number | null,
  });

  useEffect(() => {
    onProgressRef.current = onProgress;
  });

  useLayoutEffect(() => {
    const state = tracking.current;

    if (!article || !main.current || state.articleId === article.articleId) {
      return;
    }

    state.articleId = article.articleId;
    state.markedRead = false;
    state.position = article.progress.scrollPosition;

    main.current.scrollTop = scrollOffset(
      article.progress.scrollPosition,
      main.current
    );
  }, [article]);

  useEffect(() => {
    const state = tracking.current;

    return () => {
      if (state.timer !== null) {
        window.clearTimeout(state.timer);
        state.timer = null;
        onProgressRef.current(state.position);
      }
    };
  }, []);

  const onScroll = () => {
    const state = tracking.current;

    if (!article || !main.current || state.articleId !== article.articleId) {
      return;
    }

    const previous = state.position;

    state.position = scrollPosition(main.current);

    if (
      article.dateRead === null &&
      !state.markedRead &&
      crossedEnd(previous, state.position)
    ) {
      state.markedRead = true;
      onToggleRead();
    }

    if (state.timer !== null) {
      window.clearTimeout(state.timer);
    }

    state.timer = window.setTimeout(() => {
      state.timer = null;
      onProgressRef.current(state.position);
    }, PROGRESS_DEBOUNCE_MS);
  };

  const read = article !== null && article.dateRead !== null;

  const byline = article
    ? [
        article.author,
        article.publicationDate && formatDate(article.publicationDate),
      ].filter(Boolean)
    : [];

  return (
    <div className='flex h-dvh flex-col bg-background text-foreground'>
      <header className='flex h-14 shrink-0 items-center gap-3 px-3 md:px-4'>
        <Button asChild variant='ghost'>
          <Link to='/'>
            <ArrowLeft />
            Library
          </Link>
        </Button>
        <span className='flex-1 truncate text-center text-[13px] text-muted-foreground max-md:invisible'>
          {article?.title}
        </span>
        {article && (
          <div className='flex gap-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label={article.isFavorited ? 'Unfavorite' : 'Favorite'}
              aria-pressed={article.isFavorited}
              title={article.isFavorited ? 'Unfavorite' : 'Favorite'}
              onClick={onToggleFavorite}
            >
              <Star className={cn(article.isFavorited && 'fill-current')} />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={read ? 'Mark as unread' : 'Mark as read'}
              aria-pressed={read}
              title={read ? 'Mark as unread' : 'Mark as read'}
              onClick={onToggleRead}
            >
              {read ? <CircleCheck /> : <Circle />}
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label={article.isArchived ? 'Unarchive' : 'Archive'}
              title={article.isArchived ? 'Unarchive' : 'Archive'}
              onClick={onToggleArchive}
            >
              {article.isArchived ? <ArchiveRestore /> : <Archive />}
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
        <main
          ref={main}
          onScroll={onScroll}
          className='min-w-0 flex-1 overflow-y-auto px-6 pt-8 pb-24 md:px-8 md:pt-12'
        >
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
                <p className='text-[13px] text-muted-foreground'>
                  {articleSource(article)}
                  {article.readingTimeMinutes !== null &&
                    ` · ${article.readingTimeMinutes} min read`}
                </p>
                <h1 className='mt-3.5 text-[32px] leading-[1.1] font-semibold tracking-[-0.04em] text-balance md:text-[40px]'>
                  {article.title ?? article.url}
                </h1>
                {byline.length > 0 && (
                  <p className='mt-4 text-[15px] text-muted-foreground'>
                    {byline.join(' · ')}
                  </p>
                )}
                {article.content ? (
                  <ArticleContent
                    content={article.content}
                    highlights={highlights}
                    activeHighlightId={activeHighlightId}
                    onActiveHighlightChange={setActiveHighlightId}
                    onCreateHighlight={onCreateHighlight}
                    onUpdateHighlight={onUpdateHighlight}
                    onDeleteHighlight={onDeleteHighlight}
                  />
                ) : (
                  <p className='mt-10 text-muted-foreground'>
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
            onToggleRead={onToggleRead}
            onDelete={onDelete}
            highlights={highlights}
            onSelectHighlight={(highlight) =>
              setActiveHighlightId(highlight.highlightId)
            }
          />
        )}
      </div>
    </div>
  );
}
