import type { Article, ArticlePage, UpdateArticle } from '@later/types';
import type { InfiniteData } from '@tanstack/react-query';

export const POLL_INTERVAL = 2000;

export type View = 'inbox' | 'favorites' | 'archive';

export type Sort = 'newest' | 'oldest';

export const VIEWS: { value: View; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'archive', label: 'Archive' },
];

export function inView(article: Article, view: View): boolean {
  if (view === 'inbox') {
    return !article.is_archived;
  }

  if (view === 'favorites') {
    return article.is_favorited;
  }

  return article.is_archived;
}

export function countArticles(articles: Article[]): Record<View, number> {
  return {
    inbox: articles.filter((article) => inView(article, 'inbox')).length,
    favorites: articles.filter((article) => inView(article, 'favorites'))
      .length,
    archive: articles.filter((article) => inView(article, 'archive')).length,
  };
}

export function filterArticles(
  articles: Article[],
  { view, query, sort }: { view: View; query: string; sort: Sort }
): Article[] {
  const needle = query.trim().toLowerCase();

  const direction = sort === 'newest' ? -1 : 1;

  return articles
    .filter((article) => inView(article, view))
    .filter(
      (article) =>
        needle === '' ||
        [article.title, article.site_name, article.author, article.url].some(
          (value) => value?.toLowerCase().includes(needle)
        )
    )
    .toSorted(
      (a, b) =>
        direction * (Date.parse(a.date_saved) - Date.parse(b.date_saved))
    );
}

export function applyUpdate<T extends Article>(
  article: T,
  { is_read, ...fields }: UpdateArticle,
  now: Date
): T {
  return {
    ...article,
    ...fields,
    date_read:
      is_read === undefined
        ? article.date_read
        : is_read
          ? (article.date_read ?? now.toISOString())
          : null,
  };
}

export function patchArticle(
  articles: Article[],
  articleId: string,
  patch: (article: Article) => Article
): Article[] {
  return articles.map((article) =>
    article.article_id === articleId ? patch(article) : article
  );
}

export function mapPages(
  data: InfiniteData<ArticlePage> | undefined,
  update: (articles: Article[]) => Article[]
): InfiniteData<ArticlePage> | undefined {
  return (
    data && {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        articles: update(page.articles),
      })),
    }
  );
}

export function prependArticle(
  data: InfiniteData<ArticlePage> | undefined,
  article: Article
): InfiniteData<ArticlePage> | undefined {
  return (
    data && {
      ...data,
      pages: data.pages.map((page, index) =>
        index === 0 ? { ...page, articles: [article, ...page.articles] } : page
      ),
    }
  );
}

export function removeArticle(
  articles: Article[],
  articleId: string
): Article[] {
  return articles.filter((article) => article.article_id !== articleId);
}

export function pendingArticle(
  articleId: string,
  url: string,
  dateSaved: string
): Article {
  return {
    article_id: articleId,
    url,
    status: 'pending',
    title: null,
    author: null,
    excerpt: null,
    site_name: null,
    lang: null,
    dir: null,
    publication_date: null,
    word_count: null,
    reading_time_minutes: null,
    is_archived: false,
    is_favorited: false,
    date_saved: dateSaved,
    date_read: null,
    progress: { scroll_position: 0, time_spent_seconds: 0 },
  };
}

export function replaceArticle(
  articles: Article[],
  articleId: string,
  article: Article
): Article[] {
  return articles
    .filter(({ article_id }) => article_id !== article.article_id)
    .map((other) => (other.article_id === articleId ? article : other));
}

export function pollInterval(articles: Article[]): number | false {
  return articles.some(({ status }) => status === 'pending')
    ? POLL_INTERVAL
    : false;
}
