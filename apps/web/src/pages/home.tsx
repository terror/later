import { getLoginUrl } from '@/lib/api';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
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
          to='/sign-in'
          className='flex h-11 items-center text-[15px] font-medium'
        >
          Sign in
        </Link>
      </header>
      <main className='flex flex-1 flex-col justify-center py-24'>
        <h1 className='max-w-[18ch] text-4xl leading-[1.08] font-medium tracking-[-0.04em] text-pretty sm:text-6xl lg:text-[68px]'>
          later saves the articles you find{' '}
          <span className='text-neutral-500'>
            and keeps them until you&rsquo;re ready to read.
          </span>
        </h1>
        <a
          href={getLoginUrl()}
          className='mt-12 flex h-11 items-center gap-2 self-start text-[17px] font-medium'
        >
          Continue with GitHub
          <ArrowRight className='size-[18px]' aria-hidden />
        </a>
      </main>
    </div>
  );
}
