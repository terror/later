import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function articleSource(article: {
  url: string;
  siteName: string | null;
}): string {
  if (article.siteName) {
    return article.siteName;
  }

  try {
    return new URL(article.url).hostname.replace(/^www\./, '');
  } catch {
    return article.url;
  }
}
