import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/' replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
