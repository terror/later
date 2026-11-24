import { browser } from '#imports';
import { Button } from '@/components/ui/button';
import { UnauthorizedError, WEB_URL, request, token } from '@/utils/api';
import { useEffect, useState } from 'react';

type Status =
  | { kind: 'saving' }
  | { kind: 'saved'; title: string | null }
  | { kind: 'error'; message: string };

async function savePage(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined || !tab.url || !/^https?:/.test(tab.url)) {
    throw new Error('This page can’t be saved.');
  }

  const html = await browser.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.outerHTML,
    })
    .then(([result]) => result?.result as string | undefined)
    .catch(() => undefined);

  const response = await request('/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: tab.url, html }),
  });

  if (!response.ok) {
    throw new Error('Something went wrong. Try again.');
  }

  const article = await response.json();

  return article.title ?? null;
}

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);

  const [status, setStatus] = useState<Status>({ kind: 'saving' });

  useEffect(() => {
    token.getValue().then((value) => setConnected(value !== null));
    return token.watch((value) => setConnected(value !== null));
  }, []);

  useEffect(() => {
    if (!connected) {
      return;
    }

    setStatus({ kind: 'saving' });

    savePage()
      .then((title) => setStatus({ kind: 'saved', title }))
      .catch((error) => {
        if (!(error instanceof UnauthorizedError)) {
          setStatus({ kind: 'error', message: error.message });
        }
      });
  }, [connected]);

  const connect = () => {
    browser.runtime.sendMessage('connect');
  };

  const disconnect = async () => {
    await request('/tokens', { method: 'DELETE' }).catch(() => undefined);
    await token.removeValue();
  };

  if (connected === null) {
    return null;
  }

  if (!connected) {
    return (
      <main className='flex w-[280px] flex-col gap-3 bg-white p-5 text-neutral-900 antialiased'>
        <p className='text-[17px] font-medium tracking-[-0.02em]'>
          Save pages to later.
        </p>
        <Button
          type='button'
          className='h-10 rounded-[10px] bg-neutral-900 text-white hover:bg-neutral-800'
          onClick={connect}
        >
          Connect
        </Button>
      </main>
    );
  }

  return (
    <main className='flex w-[280px] flex-col gap-3 bg-white p-5 text-neutral-900 antialiased'>
      {status.kind === 'saving' && (
        <p className='text-[17px] font-medium tracking-[-0.02em]'>Saving…</p>
      )}
      {status.kind === 'saved' && (
        <>
          <p className='text-[17px] font-medium tracking-[-0.02em]'>Saved.</p>
          {status.title && (
            <p className='truncate text-[13px] text-neutral-500'>
              {status.title}
            </p>
          )}
        </>
      )}
      {status.kind === 'error' && (
        <p className='text-[17px] font-medium tracking-[-0.02em]'>
          {status.message}
        </p>
      )}
      <footer className='mt-1 flex justify-between text-[13px] text-neutral-500'>
        <a
          href={WEB_URL}
          target='_blank'
          rel='noreferrer'
          className='hover:text-neutral-900'
        >
          Open later
        </a>
        <button
          type='button'
          className='cursor-pointer hover:text-neutral-900'
          onClick={disconnect}
        >
          Disconnect
        </button>
      </footer>
    </main>
  );
}
