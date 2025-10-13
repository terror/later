import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { BookMarked } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className='bg-background text-foreground relative min-h-screen overflow-hidden'>
      <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(15,20,25,0.08),_transparent_55%)]' />

      {/* Header */}
      <motion.header
        className='border-border/60 border-b backdrop-blur'
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8'>
          <span className='flex items-center gap-2 text-xl font-semibold tracking-tight'>
            {' '}
            <BookMarked className='h-4 w-4' />
            later
          </span>
          <div className='flex items-center gap-2 text-sm'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/sign-in'>Sign in</Link>
            </Button>
            <Button size='sm' className='px-4'>
              Get started
            </Button>
          </div>
        </div>
      </motion.header>

      <main className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        {/* Hero */}
        <motion.section
          className='relative py-24 sm:py-32'
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className='mx-auto max-w-3xl text-center'>
            <span className='border-border/80 inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em]'>
              Calm your reading list
            </span>
            <h1 className='mt-10 text-balance text-4xl font-semibold tracking-tight sm:text-6xl'>
              Save what matters, revisit when it feels right.
            </h1>
            <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 sm:text-lg'>
              Later is a minimal space for articles, newsletters, and ideas
              worth keeping. Capture links in a second, return to a focused
              reader, and keep your queue tangible—not overwhelming.
            </p>
            <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4'>
              <Button size='lg' className='w-full sm:w-auto sm:px-8'>
                Get started
              </Button>
              <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                Join the waitlist
              </Button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
