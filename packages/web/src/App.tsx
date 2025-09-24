import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookmarkIcon, GlobeIcon, ShareIcon } from 'lucide-react';

function App() {
  return (
    <div className='min-h-screen'>
      {/* Header */}
      <motion.header
        className='border-b'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className='mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between'>
            <span className='text-xl font-bold'>later</span>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='sm'>
                Sign In
              </Button>
              <Button size='sm'>Get Started</Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className='mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8'>
        <motion.div
          className='text-center'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className='text-4xl font-bold tracking-tight sm:text-6xl'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Save Anything. Read Anywhere.
          </motion.h1>
          <motion.p
            className='mx-auto mt-6 max-w-2xl text-lg leading-8'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Bookmark articles, blog posts, and web pages to read when you have
            time. Organize your reading list and never lose track of interesting
            content again.
          </motion.p>
          <motion.div
            className='mt-10 flex items-center justify-center gap-x-6'
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button size='lg' className='px-8'>
              Get Started
            </Button>
            <Button variant='outline' size='lg'>
              Learn More
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          className='mx-auto mt-24 max-w-4xl'
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-3'>
            <motion.div
              className='text-center'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg'>
                <BookmarkIcon className='h-6 w-6' />
              </div>
              <h3 className='mt-4 text-lg font-semibold'>Quick Bookmarking</h3>
              <p className='mt-2 text-sm'>
                Save articles with a single click using our browser extension or
                mobile app.
              </p>
            </motion.div>
            <motion.div
              className='text-center'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg'>
                <GlobeIcon className='h-6 w-6' />
              </div>
              <h3 className='mt-4 text-lg font-semibold'>Access Anywhere</h3>
              <p className='mt-2 text-sm'>
                Your reading list syncs across all your devices. Read on web,
                mobile, or offline.
              </p>
            </motion.div>
            <motion.div
              className='text-center'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.6 }}
            >
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-lg'>
                <ShareIcon className='h-6 w-6' />
              </div>
              <h3 className='mt-4 text-lg font-semibold'>Organize & Share</h3>
              <p className='mt-2 text-sm'>
                Tag and organize your articles. Share your favorite reads with
                friends.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
