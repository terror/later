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
