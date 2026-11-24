import { sessionQuery } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const { data, isPending } = useQuery(sessionQuery);

  return { user: data ?? null, loading: isPending };
}
