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
    return !article.isArchived;
  }

  if (view === 'favorites') {
    return article.isFavorited;
  }

  return article.isArchived;
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
        [article.title, article.siteName, article.author, article.url].some(
          (value) => value?.toLowerCase().includes(needle)
        )
    )
    .toSorted(
      (a, b) => direction * (Date.parse(a.dateSaved) - Date.parse(b.dateSaved))
    );
}

export function applyUpdate<T extends Article>(
  article: T,
  { isRead, ...fields }: UpdateArticle,
  now: Date
): T {
  return {
    ...article,
    ...fields,
    dateRead:
      isRead === undefined
        ? article.dateRead
        : isRead
          ? (article.dateRead ?? now.toISOString())
          : null,
  };
}

export function patchArticle(
  articles: Article[],
  articleId: string,
  patch: (article: Article) => Article
): Article[] {
  return articles.map((article) =>
    article.articleId === articleId ? patch(article) : article
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
  return articles.filter((article) => article.articleId !== articleId);
}

export function pendingArticle(
  articleId: string,
  url: string,
  dateSaved: string
): Article {
  return {
    articleId: articleId,
    url,
    status: 'pending',
    title: null,
    author: null,
    excerpt: null,
    siteName: null,
    lang: null,
    dir: null,
    publicationDate: null,
    wordCount: null,
    readingTimeMinutes: null,
    isArchived: false,
    isFavorited: false,
    dateSaved: dateSaved,
    dateRead: null,
    progress: { scrollPosition: 0, timeSpentSeconds: 0 },
  };
}

export function replaceArticle(
  articles: Article[],
  articleId: string,
  article: Article
): Article[] {
  return articles
    .filter(({ articleId }) => articleId !== article.articleId)
    .map((other) => (other.articleId === articleId ? article : other));
}

export function pollInterval(articles: Article[]): number | false {
  return articles.some(({ status }) => status === 'pending')
    ? POLL_INTERVAL
    : false;
}
