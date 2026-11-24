import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const REPOSITORY_URL = 'https://github.com/terror/later';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-background text-foreground antialiased'>
      <header className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10'>
        <Link to='/' aria-label='later home'>
          <Logo />
        </Link>
        <nav aria-label='Primary' className='flex items-center gap-1'>
          <Button asChild variant='ghost' className='max-sm:hidden'>
            <a href={REPOSITORY_URL}>GitHub</a>
          </Button>
          <Button asChild variant='secondary'>
            <Link to='/sign-in'>Sign in</Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className='mx-auto max-w-6xl px-6 pt-16 pb-14 sm:px-10 sm:pt-24'>
          <h1 className='max-w-[18ch] text-4xl leading-[1.06] font-semibold tracking-[-0.04em] text-pretty sm:text-6xl'>
            later saves the articles you find{' '}
            <span className='text-muted-foreground'>
              and keeps them until you&rsquo;re ready to read.
            </span>
          </h1>
        </section>
        <section className='mx-auto max-w-6xl px-4 pb-24 sm:px-8'>
          <picture>
            <source srcSet='/screenshot.webp' type='image/webp' />
            <img
              src='/screenshot.png'
              width={1430}
              height={968}
              alt='The later library on a laptop in light mode, with the phone app in dark mode'
              className='h-auto w-full'
            />
          </picture>
        </section>
      </main>
      <footer className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-12 text-sm text-muted-foreground sm:px-10'>
        <Logo className='text-foreground' />
        <nav aria-label='Footer' className='flex gap-6'>
          <a href={REPOSITORY_URL} className='hover:text-foreground'>
            GitHub
          </a>
          <Link to='/privacy' className='hover:text-foreground'>
            Privacy
          </Link>
          <Link to='/sign-in' className='hover:text-foreground'>
            Sign in
          </Link>
        </nav>
      </footer>
    </div>
  );
}
