import { token } from '@/utils/api';
import { queryOptions } from '@tanstack/react-query';

export const tokenQuery = queryOptions({
  queryKey: ['token'],
  queryFn: () => token.getValue(),
  staleTime: Infinity,
});
