import type { User } from '@/lib/types';
import { createContext } from 'react';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
