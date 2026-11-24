import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { createToken, getLoginUrl } from '@/lib/api';
import { parseExtensionRedirect } from '@/lib/extension';
import { useMutation } from '@tanstack/react-query';
import { Github } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ConnectPage() {
  const { user, loading } = useAuth();

  const [searchParams] = useSearchParams();

  const redirect = parseExtensionRedirect(searchParams.get('redirect_uri'));

  const connect = useMutation({
    mutationFn: createToken,
    onSuccess: (token) => {
      if (redirect) {
        window.location.replace(
          `${redirect.href}#token=${encodeURIComponent(token)}`
        );
      }
    },
    onError: (error) => console.error(error),
  });

  const connecting = connect.isPending || connect.isSuccess;

  if (loading) {
    return null;
  }

  return (
    <div className='flex min-h-screen flex-col bg-background px-6 pt-10 pb-14 text-foreground antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link to='/' aria-label='later home'>
          <Logo />
        </Link>
      </header>
      <main className='flex flex-1 flex-col items-start justify-center py-24'>
        {!redirect ? (
          <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
            This link isn&rsquo;t valid.
            <span className='text-muted-foreground'>
              {' '}
              Open it from the extension.
            </span>
          </h1>
        ) : !user ? (
          <>
            <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
              Sign in
              <span className='text-muted-foreground'>
                {' '}
                to connect the extension.
              </span>
            </h1>
            <a
              href={getLoginUrl()}
              className='mt-12 flex h-13 items-center gap-2.5 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground'
            >
              <Github className='size-[18px]' aria-hidden />
              Continue with GitHub
            </a>
          </>
        ) : (
          <>
            <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
              Connect the extension
              <span className='text-muted-foreground'>
                {' '}
                to save pages to later.
              </span>
            </h1>
            <button
              type='button'
              onClick={() => connect.mutate()}
              disabled={connecting}
              className='mt-12 flex h-13 items-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground disabled:opacity-60'
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
            <p className='mt-5 text-sm text-muted-foreground'>
              {connect.isError
                ? 'Something went wrong. Try again.'
                : `Signed in as ${user.email}.`}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
