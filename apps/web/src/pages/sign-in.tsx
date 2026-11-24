import { Logo } from '@/components/logo';
import { SignInButtons } from '@/components/sign-in-buttons';
import { useAuth } from '@/hooks/use-auth';
import { useProviders } from '@/hooks/use-providers';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const { user, loading } = useAuth();

  const { providers, loading: providersLoading } = useProviders();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading || providersLoading) {
    return null;
  }

  return (
    <div className='bg-background text-foreground flex min-h-screen flex-col px-6 pt-10 pb-14 antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link to='/' aria-label='later home'>
          <Logo />
        </Link>
        <Link
          to='/'
          className='text-muted-foreground flex h-11 items-center gap-1.5 text-[15px] font-medium'
        >
          <ArrowLeft className='size-4' aria-hidden />
          Back
        </Link>
      </header>
      <main className='flex flex-1 flex-col items-start justify-center py-24'>
        <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl lg:text-[68px]'>
          Sign in
          <span className='text-muted-foreground'> to keep reading.</span>
        </h1>
        <div className='mt-12 flex flex-wrap items-center gap-3'>
          <SignInButtons providers={providers} size='xl' />
        </div>
        <p className='text-muted-foreground mt-5 text-sm'>
          New here? Signing in creates your account.
        </p>
      </main>
    </div>
  );
}
