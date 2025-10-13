import { AuthContext } from '@/contexts/auth-context';
import { getSession } from '@/lib/api';
import type { User } from '@/lib/types';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    setLoading(true);

    try {
      const sessionUser = await getSession();
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
