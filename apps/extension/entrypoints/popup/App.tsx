import { browser } from '#imports';
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
      <main>
        <p className='heading'>Save pages to later.</p>
        <button type='button' className='primary' onClick={connect}>
          Connect
        </button>
      </main>
    );
  }

  return (
    <main>
      {status.kind === 'saving' && <p className='heading'>Saving…</p>}
      {status.kind === 'saved' && (
        <>
          <p className='heading'>Saved.</p>
          {status.title && <p className='muted'>{status.title}</p>}
        </>
      )}
      {status.kind === 'error' && <p className='heading'>{status.message}</p>}
      <footer>
        <a href={WEB_URL} target='_blank' rel='noreferrer'>
          Open later
        </a>
        <button type='button' className='link' onClick={disconnect}>
          Disconnect
        </button>
      </footer>
    </main>
  );
}
