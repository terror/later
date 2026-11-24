import { useAuth } from '@/hooks/use-auth';
import LandingPage from '@/pages/landing';
import LibraryPage from '@/pages/library';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <LibraryPage /> : <LandingPage />;
}
