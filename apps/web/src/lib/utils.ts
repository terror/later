import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function articleSource(article: {
  url: string;
  site_name: string | null;
}): string {
  if (article.site_name) {
    return article.site_name;
  }

  try {
    return new URL(article.url).hostname.replace(/^www\./, '');
  } catch {
    return article.url;
  }
}
