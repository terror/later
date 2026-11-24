const MINUTE = 60 * 1000;

const HOUR = 60 * MINUTE;

const DAY = 24 * HOUR;

function calendarDay(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDate(value: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatSaved(
  value: string,
  now: Date,
  timeZone?: string
): string {
  const date = new Date(value);

  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) {
    return 'Just now';
  }

  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m`;
  }

  const today = calendarDay(now, timeZone);

  if (calendarDay(date, timeZone) === today && elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h`;
  }

  if (
    calendarDay(date, timeZone) ===
    calendarDay(new Date(now.getTime() - DAY), timeZone)
  ) {
    return 'Yesterday';
  }

  if (elapsed < 7 * DAY) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    }).format(date);
  }

  const sameYear =
    calendarDay(date, timeZone).slice(0, 4) === today.slice(0, 4);

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  }).format(date);
}

export function formatLength(
  words: number | null,
  minutes: number | null
): string | null {
  const parts = [
    words === null ? null : `${words.toLocaleString('en-US')} words`,
    minutes === null ? null : `${minutes} min`,
  ].filter((part) => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
}
