import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/lib/api';
import {
  ArrowUpRight,
  BookOpen,
  Code,
  Github,
  Inbox,
  type LucideIcon,
  MonitorSmartphone,
  MousePointerClick,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const REPOSITORY_URL = 'https://github.com/terror/later';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: MousePointerClick,
    title: 'Save in one click',
    description:
      'The browser extension saves the page you’re on, exactly as you see it, even when it’s behind a sign-in.',
  },
  {
    icon: BookOpen,
    title: 'A calm place to read',
    description:
      'Articles are pulled out of the page into clean text, without the clutter that surrounds them.',
  },
  {
    icon: Inbox,
    title: 'Inbox, favorites, archive',
    description:
      'Keep what’s next in your inbox, star the pieces worth keeping, and archive the rest.',
  },
  {
    icon: Search,
    title: 'Find it again',
    description: 'Search your library by title, site, or author.',
  },
  {
    icon: MonitorSmartphone,
    title: 'On every screen',
    description:
      'Works on your laptop and your phone, and follows your light or dark setting.',
  },
  {
    icon: Code,
    title: 'Open source',
    description:
      'Built in the open with Rust and React. Read the code, or run it yourself.',
  },
];

const STEPS = [
  {
    title: 'Sign in with GitHub',
    description: 'No new password to remember.',
  },
  {
    title: 'Connect the extension',
    description: 'Approve it once and it stays signed in.',
  },
  {
    title: 'Save now, read later',
    description: 'Pick up where you left off on any device.',
  },
];

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground min-h-screen antialiased'>
      <header className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10'>
        <Link to='/' aria-label='later home'>
          <Logo />
        </Link>
        <nav aria-label='Primary' className='flex items-center gap-1'>
          <Button asChild variant='ghost' className='max-sm:hidden'>
            <a href='#features'>Features</a>
          </Button>
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
          <div className='mt-10 flex flex-wrap items-center gap-3'>
            <Button asChild size='lg'>
              <a href={getLoginUrl()}>
                <Github />
                Continue with GitHub
              </a>
            </Button>
            <Button asChild size='lg' variant='ghost'>
              <a href={REPOSITORY_URL}>
                View the source
                <ArrowUpRight />
              </a>
            </Button>
          </div>
        </section>
        <section className='mx-auto max-w-6xl px-4 sm:px-8'>
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
        <section
          id='features'
          className='mx-auto max-w-6xl scroll-mt-8 px-6 pt-28 sm:px-10'
        >
          <h2 className='max-w-[22ch] text-3xl leading-tight font-semibold tracking-[-0.035em] text-pretty sm:text-4xl'>
            Everything you need to read later,{' '}
            <span className='text-muted-foreground'>and nothing else.</span>
          </h2>
          <ul className='mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4'>
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className='bg-card flex flex-col gap-3 rounded-2xl p-6'
              >
                <span className='bg-background flex size-9 items-center justify-center rounded-lg'>
                  <Icon className='size-[18px]' aria-hidden />
                </span>
                <h3 className='text-[15px] font-semibold tracking-[-0.012em]'>
                  {title}
                </h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className='mx-auto max-w-6xl px-6 pt-28 sm:px-10'>
          <h2 className='text-3xl font-semibold tracking-[-0.035em] sm:text-4xl'>
            How it works
          </h2>
          <ol className='mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-8'>
            {STEPS.map(({ title, description }, index) => (
              <li key={title} className='flex flex-col gap-2'>
                <span className='bg-muted flex size-8 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums'>
                  {index + 1}
                </span>
                <h3 className='mt-2 text-[15px] font-semibold tracking-[-0.012em]'>
                  {title}
                </h3>
                <p className='text-muted-foreground text-sm'>{description}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className='mx-auto max-w-6xl px-6 pt-28 pb-24 sm:px-10'>
          <div className='bg-card flex flex-col items-start gap-6 rounded-3xl px-8 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-12'>
            <h2 className='text-2xl font-semibold tracking-[-0.03em] sm:text-3xl'>
              Start your reading list.
            </h2>
            <Button asChild size='lg'>
              <a href={getLoginUrl()}>
                <Github />
                Continue with GitHub
              </a>
            </Button>
          </div>
        </section>
      </main>
      <footer className='text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-12 text-sm sm:px-10'>
        <Logo className='text-foreground' />
        <nav aria-label='Footer' className='flex gap-6'>
          <a href={REPOSITORY_URL} className='hover:text-foreground'>
            GitHub
          </a>
          <Link to='/sign-in' className='hover:text-foreground'>
            Sign in
          </Link>
        </nav>
      </footer>
    </div>
  );
}
