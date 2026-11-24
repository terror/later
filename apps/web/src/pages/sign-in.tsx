import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { getLoginUrl } from '@/lib/api';
import { ArrowLeft, Github } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      void navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
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
        <a
          href={getLoginUrl()}
          className='bg-primary text-primary-foreground mt-12 flex h-13 items-center gap-2.5 rounded-xl px-6 text-base font-medium'
        >
          <Github className='size-[18px]' aria-hidden />
          Continue with GitHub
        </a>
        <p className='text-muted-foreground mt-5 text-sm'>
          New here? Signing in creates your account.
        </p>
      </main>
    </div>
  );
}
