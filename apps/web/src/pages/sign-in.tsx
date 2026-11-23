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
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className='flex min-h-screen flex-col bg-white px-6 pt-10 pb-14 text-neutral-900 antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link
          to='/'
          className='text-[22px] leading-none font-semibold tracking-[-0.035em]'
        >
          later
        </Link>
        <Link
          to='/'
          className='flex h-11 items-center gap-1.5 text-[15px] font-medium text-neutral-500'
        >
          <ArrowLeft className='size-4' aria-hidden />
          Back
        </Link>
      </header>
      <main className='flex flex-1 flex-col items-start justify-center py-24'>
        <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl lg:text-[68px]'>
          Sign in
          <span className='text-neutral-500'> to keep reading.</span>
        </h1>
        <a
          href={getLoginUrl()}
          className='mt-12 flex h-13 items-center gap-2.5 rounded-xl bg-neutral-900 px-6 text-base font-medium text-white'
        >
          <Github className='size-[18px]' aria-hidden />
          Continue with GitHub
        </a>
        <p className='mt-5 text-sm text-neutral-500'>
          New here? Signing in creates your account.
        </p>
      </main>
    </div>
  );
}
