import { browser } from '#imports';
import { Button } from '@/components/ui/button';
import { useConnected } from '@/hooks/use-connected';
import { useDisconnect, useSavePage } from '@/hooks/use-popup-mutations';
import { saveStatus } from '@/lib/save';
import { WEB_URL } from '@/utils/api';
import { useEffect } from 'react';

export default function App() {
  const connected = useConnected();

  const save = useSavePage();

  const disconnect = useDisconnect();

  const { mutate } = save;

  useEffect(() => {
    if (connected) {
      mutate();
    }
  }, [connected, mutate]);

  const status = saveStatus(save);

  const connect = () => {
    browser.runtime.sendMessage('connect');
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
          onClick={() => disconnect.mutate()}
        >
          Disconnect
        </button>
      </footer>
    </main>
  );
}
