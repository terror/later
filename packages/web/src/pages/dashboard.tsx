import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getLogoutUrl } from '@/lib/api';
import { motion } from 'framer-motion';
import { BookMarked } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = getLogoutUrl();
  };

  return (
    <div className='bg-background text-foreground min-h-screen'>
      {/* Header */}
      <motion.header
        className='border-border/60 border-b backdrop-blur'
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8'>
          <Link
            to='/'
            className='flex items-center gap-2 text-xl font-semibold tracking-tight'
          >
            <BookMarked className='h-4 w-4' />
            later
          </Link>
          <div className='flex items-center gap-3 text-sm'>
            <span className='text-muted-foreground'>
              {user?.name || user?.email}
            </span>
            <Button
              className='cursor-pointer'
              variant='ghost'
              size='sm'
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </motion.header>
      <p className='p-8 text-center'>
        🚧 This dashboard is a work in progress, check back later! 🚧
      </p>
    </div>
  );
}
