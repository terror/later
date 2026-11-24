import type { Article } from './types';

export type View = 'inbox' | 'favorites' | 'archive';

export type Sort = 'newest' | 'oldest';

export const VIEWS: { value: View; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'archive', label: 'Archive' },
];

export function inView(article: Article, view: View): boolean {
  switch (view) {
    case 'inbox':
      return !article.is_archived;
    case 'favorites':
      return article.is_favorited;
    case 'archive':
      return article.is_archived;
  }
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
    .sort(
      (a, b) =>
        direction * (Date.parse(a.date_saved) - Date.parse(b.date_saved))
    );
}

export type ArticleUpdate = {
  is_archived?: boolean;
  is_favorited?: boolean;
  is_read?: boolean;
};

export function applyUpdate<T extends Article>(
  article: T,
  { is_read, ...fields }: ArticleUpdate,
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

export function removeArticle(
  articles: Article[],
  articleId: string
): Article[] {
  return articles.filter((article) => article.article_id !== articleId);
}
