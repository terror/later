import { useAuth } from '@/hooks/use-auth';
import { useProviders } from '@/hooks/use-providers';
import LandingPage from '@/pages/landing';
import LibraryPage from '@/pages/library';

export default function HomePage() {
  const { user, loading } = useAuth();

  const { providers, loading: providersLoading } = useProviders();

  if (loading || providersLoading) {
    return null;
  }

  return user ? <LibraryPage /> : <LandingPage providers={providers} />;
}
