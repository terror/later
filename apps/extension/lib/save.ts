import type { MutationStatus } from '@tanstack/react-query';

import { UnauthorizedError } from './errors';

export type Status =
  | { kind: 'saving' }
  | { kind: 'saved'; title: string | null }
  | { kind: 'error'; message: string };

export function isSavable(url: string | undefined): url is string {
  return url !== undefined && /^https?:/.test(url);
}

export function saveStatus({
  status,
  data,
  error,
}: {
  status: MutationStatus;
  data: string | null | undefined;
  error: Error | null;
}): Status {
  if (status === 'success') {
    return { kind: 'saved', title: data ?? null };
  }

  if (status === 'error' && !(error instanceof UnauthorizedError)) {
    return { kind: 'error', message: error?.message ?? '' };
  }

  return { kind: 'saving' };
}
