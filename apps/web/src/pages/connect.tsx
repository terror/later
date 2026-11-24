import { Logo } from '@/components/logo';
import { SignInButtons } from '@/components/sign-in-buttons';
import { useAuth } from '@/hooks/use-auth';
import { useProviders } from '@/hooks/use-providers';
import { createToken } from '@/lib/api';
import { parseExtensionRedirect } from '@/lib/extension';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

export default function ConnectPage() {
  const { user, loading } = useAuth();

  const { providers, loading: providersLoading } = useProviders();

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

  if (loading || providersLoading) {
    return null;
  }

  return (
    <div className='bg-background text-foreground flex min-h-screen flex-col px-6 pt-10 pb-14 antialiased sm:px-12'>
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
            <div className='mt-12 flex flex-wrap items-center gap-3'>
              <SignInButtons providers={providers} size='xl' />
            </div>
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
              className='bg-primary text-primary-foreground mt-12 flex h-13 items-center rounded-xl px-6 text-base font-medium disabled:opacity-60'
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
            <p className='text-muted-foreground mt-5 text-sm'>
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
