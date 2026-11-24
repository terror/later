import { AddLink } from '@/components/add-link';
import { AppSidebar } from '@/components/app-sidebar';
import { ArticleInfo } from '@/components/article-info';
import { ArticleRow } from '@/components/article-row';
import { Mark } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  type Sort,
  VIEWS,
  type View,
  countArticles,
  filterArticles,
} from '@/lib/library';
import type { Article, User } from '@later/types';
import { ArrowDownUp, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const LABELS: Record<View, string> = {
  inbox: 'Inbox',
  favorites: 'Favorites',
  archive: 'Archive',
};

const EMPTY: Record<View, { title: string; description: string }> = {
  inbox: {
    title: 'Nothing to read yet.',
    description: 'Add a link, or save pages with the later browser extension.',
  },
  favorites: {
    title: 'No favorites yet.',
    description: 'Star an article to keep it here.',
  },
  archive: {
    title: 'Nothing archived.',
    description: 'Archived articles show up here.',
  },
};

const SORT_LABELS: Record<Sort, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
};

export function Library({
  articles,
  error = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  user,
  signOutHref,
  now,
  onToggleFavorite,
  onToggleArchive,
  onToggleRead,
  onDelete,
  onAddLink,
}: {
  articles: Article[] | null;
  error?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  user: User | null;
  signOutHref: string;
  now: Date;
  onToggleFavorite: (article: Article) => void;
  onToggleArchive: (article: Article) => void;
  onToggleRead: (article: Article) => void;
  onDelete: (article: Article) => void;
  onAddLink: (url: string) => void;
}) {
  const [view, setView] = useState<View>('inbox');

  const [query, setQuery] = useState('');

  const [sort, setSort] = useState<Sort>('newest');

  const [activeId, setActiveId] = useState<string | null>(null);

  const search = useRef<HTMLInputElement>(null);

  const scroller = useRef<HTMLDivElement>(null);

  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore || !sentinel.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scroller.current, rootMargin: '400px' }
    );

    observer.observe(sentinel.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore, articles]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      event.preventDefault();
      search.current?.focus();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const visible = articles
    ? filterArticles(articles, { view, query, sort })
    : [];

  const counts = countArticles(articles ?? []);

  const active =
    visible.find((article) => article.article_id === activeId) ?? visible[0];

  const empty = query.trim()
    ? {
        title: `No matches for “${query.trim()}”.`,
        description: 'Try a different search.',
      }
    : EMPTY[view];

  return (
    <div className='bg-background text-foreground flex h-dvh'>
      <AppSidebar
        className='hidden md:flex'
        view={view}
        counts={counts}
        onViewChange={setView}
        user={user}
        signOutHref={signOutHref}
      />
      <main className='flex min-w-0 flex-1 flex-col'>
        <header className='flex flex-col gap-3 px-5 pt-5 pb-2 md:h-16 md:flex-row md:items-center md:px-6 md:py-0'>
          <div className='flex items-center gap-3 md:flex-1'>
            <Mark className='size-7 md:hidden' />
            <h1 className='flex-1 text-[28px] font-semibold tracking-[-0.035em] md:text-[22px] md:tracking-[-0.03em]'>
              {LABELS[view]}{' '}
              <span className='text-muted-foreground font-normal tabular-nums'>
                {articles ? visible.length : ''}
              </span>
            </h1>
            <Button asChild variant='ghost' size='icon' className='md:hidden'>
              <a href={signOutHref} aria-label='Sign out' title='Sign out'>
                <LogOut />
              </a>
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <SearchField
              ref={search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search'
              aria-label='Search articles'
              shortcut='/'
              className='flex-1 md:w-64 md:flex-none'
            />
            <Button
              variant='secondary'
              className='hidden md:inline-flex'
              onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
            >
              <ArrowDownUp />
              {SORT_LABELS[sort]}
            </Button>
            <AddLink onAdd={onAddLink} />
          </div>
          <SegmentedControl
            className='md:hidden'
            label='Library'
            options={VIEWS}
            value={view}
            onValueChange={setView}
          />
        </header>
        <div
          ref={scroller}
          className='flex-1 overflow-y-auto px-2 pb-6 md:px-3'
        >
          {error ? (
            <EmptyState
              title='Your articles couldn’t be loaded.'
              description='Try again in a moment.'
            />
          ) : articles === null ? null : visible.length === 0 ? (
            <EmptyState {...empty} />
          ) : (
            <ul className='flex flex-col gap-0.5'>
              {visible.map((article) => (
                <li key={article.article_id}>
                  <ArticleRow
                    article={article}
                    active={article.article_id === active?.article_id}
                    now={now}
                    onActivate={() => setActiveId(article.article_id)}
                  />
                </li>
              ))}
            </ul>
          )}
          {!error && hasMore && <div ref={sentinel} aria-hidden />}
          {!error && loadingMore && (
            <p className='text-muted-foreground py-4 text-center text-[13px]'>
              Loading more…
            </p>
          )}
        </div>
      </main>
      {active && (
        <ArticleInfo
          className='hidden xl:flex'
          article={active}
          onToggleFavorite={() => onToggleFavorite(active)}
          onToggleArchive={() => onToggleArchive(active)}
          onToggleRead={() => onToggleRead(active)}
          onDelete={() => onDelete(active)}
        />
      )}
    </div>
  );
}
