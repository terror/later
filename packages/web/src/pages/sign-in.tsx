import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getLoginUrl } from '@/lib/api';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignInPage() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSignIn = () => {
    window.location.href = getLoginUrl();
  };

  if (loading) {
    return null;
  }

  return (
    <div className='bg-background text-foreground flex min-h-screen items-center justify-center px-4'>
      <motion.div
        className='border-border/60 bg-card/80 w-full max-w-sm rounded-2xl border p-8 text-center shadow-sm backdrop-blur-sm'
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className='text-2xl font-semibold tracking-tight'>Sign in</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          Use one of the providers below to continue.
        </p>
        <Button
          size='lg'
          className='mt-6 w-full cursor-pointer justify-center px-8 text-base'
          onClick={handleSignIn}
        >
          <Github className='size-5' aria-hidden />
          Sign in with GitHub
        </Button>
      </motion.div>
    </div>
  );
}
