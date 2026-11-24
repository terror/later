import { formatDate } from './format';
import type { Article } from './types';

export const READ_THRESHOLD = 0.9;

export function scrollPosition({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): number {
  const range = scrollHeight - clientHeight;

  if (range <= 0) {
    return 1;
  }

  return (
    Math.round(Math.min(Math.max(scrollTop / range, 0), 1) * 10000) / 10000
  );
}

export function scrollOffset(
  position: number,
  { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }
): number {
  return position * Math.max(scrollHeight - clientHeight, 0);
}

export function crossedEnd(previous: number, current: number): boolean {
  return previous < READ_THRESHOLD && current >= READ_THRESHOLD;
}

export function readingStatus(article: Article, timeZone?: string): string {
  if (article.date_read !== null) {
    return `Read ${formatDate(article.date_read, timeZone)}`;
  }

  const percent = Math.round(article.progress.scroll_position * 100);

  return percent > 0 ? `${percent}% read` : 'Unread';
}
