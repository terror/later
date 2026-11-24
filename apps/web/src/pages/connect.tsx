import { useAuth } from '@/hooks/use-auth';
import { createToken, getLoginUrl } from '@/lib/api';
import { parseExtensionRedirect } from '@/lib/extension';
import { Github } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ConnectPage() {
  const { user, loading } = useAuth();

  const [searchParams] = useSearchParams();

  const [connecting, setConnecting] = useState(false);

  const [error, setError] = useState(false);

  const redirect = parseExtensionRedirect(searchParams.get('redirect_uri'));

  if (loading) {
    return null;
  }

  const connect = async () => {
    if (!redirect) {
      return;
    }

    setConnecting(true);
    setError(false);

    try {
      const token = await createToken();
      window.location.replace(
        `${redirect.href}#token=${encodeURIComponent(token)}`
      );
    } catch (error) {
      console.error(error);
      setConnecting(false);
      setError(true);
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-white px-6 pt-10 pb-14 text-neutral-900 antialiased sm:px-12'>
      <header className='flex items-center justify-between gap-4'>
        <Link
          to='/'
          className='text-[22px] leading-none font-semibold tracking-[-0.035em]'
        >
          later
        </Link>
      </header>
      <main className='flex flex-1 flex-col items-start justify-center py-24'>
        {!redirect ? (
          <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
            This link isn&rsquo;t valid.
            <span className='text-neutral-500'>
              {' '}
              Open it from the extension.
            </span>
          </h1>
        ) : !user ? (
          <>
            <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
              Sign in
              <span className='text-neutral-500'>
                {' '}
                to connect the extension.
              </span>
            </h1>
            <a
              href={getLoginUrl()}
              className='mt-12 flex h-13 items-center gap-2.5 rounded-xl bg-neutral-900 px-6 text-base font-medium text-white'
            >
              <Github className='size-[18px]' aria-hidden />
              Continue with GitHub
            </a>
          </>
        ) : (
          <>
            <h1 className='text-4xl leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl'>
              Connect the extension
              <span className='text-neutral-500'> to save pages to later.</span>
            </h1>
            <button
              type='button'
              onClick={connect}
              disabled={connecting}
              className='mt-12 flex h-13 items-center rounded-xl bg-neutral-900 px-6 text-base font-medium text-white disabled:opacity-60'
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
            <p className='mt-5 text-sm text-neutral-500'>
              {error
                ? 'Something went wrong. Try again.'
                : `Signed in as ${user.email}.`}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
