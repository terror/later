import { revokeToken, savePage } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';

export function useSavePage() {
  return useMutation({ mutationFn: savePage });
}

export function useDisconnect() {
  return useMutation({ mutationFn: revokeToken });
}
