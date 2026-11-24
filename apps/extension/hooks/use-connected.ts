import { tokenQuery } from '@/lib/queries';
import { token } from '@/utils/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useConnected(): boolean | null {
  const queryClient = useQueryClient();

  const { data } = useQuery(tokenQuery);

  useEffect(
    () =>
      token.watch((value) =>
        queryClient.setQueryData(tokenQuery.queryKey, value)
      ),
    [queryClient]
  );

  return data === undefined ? null : data !== null;
}
