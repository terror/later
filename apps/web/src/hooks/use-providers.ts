import { providersQuery } from '@/lib/queries';
import { useQuery } from '@tanstack/react-query';

export function useProviders() {
  const { data, isPending } = useQuery(providersQuery);

  return { providers: data ?? ['github' as const], loading: isPending };
}
