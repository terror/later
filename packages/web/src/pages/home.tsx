import { Button } from '@/components/ui/button';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import { BookmarkIcon, GlobeIcon, ShareIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Capture quietly',
    description:
      'Save an article, newsletter, or thread without breaking your flow. Later tucks it away until you are ready.',
    icon: BookmarkIcon,
  },
  {
    title: 'Read anywhere',
    description:
      'Pick up where you left off on desktop, phone, or offline. Your space stays in sync automatically.',
    icon: GlobeIcon,
  },
  {
    title: 'Arrange effortlessly',
    description:
      'Tag, sort, and lightly curate. Keep things minimal without losing the ability to find that one link.',
    icon: ShareIcon,
  },
];

type Metric = {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  description?: string;
};

const metrics: Metric[] = [
  {
    label: 'Reads finished',
    value: 34,
    description: 'completed without juggling your calendar',
  },
  {
    label: 'Focus time reclaimed',
    value: 6.5,
    suffix: 'hrs',
    decimals: 1,
    description: 'of deep work saved from aimless scrolling',
  },
  {
    label: 'Queue cleared',
    value: 78,
    suffix: '%',
    description: 'of what you save gets wrapped up this week',
  },
];

const steps = [
  {
    title: 'Clip in one tap',
    detail:
      'Use the browser extension or share sheet to drop anything into Later.',
  },
  {
    title: 'Queue for calm reading',
    detail:
      'A clean reading view trims the noise so you can focus on what matters.',
  },
  {
    title: 'Resurface highlights',
    detail:
      'Lightweight tags and reminders keep the right ideas close at hand.',
  },
];

const primaryCtaLabel = 'Get started';
const secondaryCtaLabel = 'Join the waitlist';

function MetricCard({
  label,
  value,
  suffix,
  decimals = 0,
  description,
  delay,
}: Metric & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (latest) =>
    Number(latest).toFixed(decimals)
  );

  useEffect(() => {
    if (!isInView) {
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      delay,
    });

    return () => controls.stop();
  }, [delay, isInView, motionValue, value]);

  return (
    <motion.div
      ref={ref}
      className='border-border/60 bg-background/40 rounded-2xl border p-6'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, delay }}
    >
      <p className='text-muted-foreground text-xs uppercase tracking-[0.3em]'>
        {label}
      </p>
      <div className='mt-3 flex items-baseline gap-2'>
        <motion.span className='text-3xl font-semibold leading-none tracking-tight'>
          {displayValue}
        </motion.span>
        {suffix ? (
          <span className='text-muted-foreground text-sm font-medium'>
            {suffix}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className='text-muted-foreground mt-3 text-xs'>{description}</p>
      ) : null}
    </motion.div>
  );
}

export default function HomePage() {
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
          <span className='text-xl font-semibold tracking-tight'>later</span>
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
                {primaryCtaLabel}
              </Button>
              <Button variant='outline' size='lg' className='w-full sm:w-auto'>
                {secondaryCtaLabel}
              </Button>
            </div>
          </div>

          <motion.div
            className='border-border/60 bg-card/70 mt-16 grid gap-4 rounded-3xl border p-6 sm:grid-cols-3 sm:p-8'
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.label}
                {...metric}
                delay={0.2 + index * 0.08}
              />
            ))}
          </motion.div>
        </motion.section>

        {/* Features */}
        <motion.section
          className='space-y-12 pb-24'
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
              Stay organised without clutter
            </h2>
            <p className='text-muted-foreground mt-4 text-base'>
              Every interaction is designed to stay out of your way. Quiet
              surfaces keep the attention on what you saved.
            </p>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                className='border-border/70 bg-card/60 hover:border-foreground/30 group relative flex h-full flex-col justify-between rounded-2xl border p-6 transition-colors duration-300'
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <feature.icon className='text-foreground/70 group-hover:text-foreground h-6 w-6 transition-colors duration-300' />
                <div className='mt-6'>
                  <h3 className='text-lg font-medium tracking-tight'>
                    {feature.title}
                  </h3>
                  <p className='text-muted-foreground mt-3 text-sm leading-6'>
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Flow */}
        <motion.section
          className='border-border/70 bg-card/60 rounded-3xl border p-8 sm:p-12'
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
              A gentle flow from save to done
            </h2>
            <p className='text-muted-foreground mt-4 text-base'>
              Later trims the busywork so you can move through your reading list
              without friction.
            </p>
          </div>
          <div className='mt-12 grid gap-6 sm:grid-cols-3'>
            {steps.map((step, index) => (
              <div
                key={step.title}
                className='border-border/60 bg-background/40 rounded-2xl border p-6'
              >
                <span className='text-muted-foreground text-sm font-medium'>
                  0{index + 1}
                </span>
                <h3 className='mt-4 text-lg font-medium tracking-tight'>
                  {step.title}
                </h3>
                <p className='text-muted-foreground mt-3 text-sm'>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          className='border-border/60 bg-card/70 my-24 rounded-3xl border p-10 text-center sm:p-16'
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <p className='text-muted-foreground text-sm uppercase tracking-[0.3em]'>
            Ready when you are
          </p>
          <h2 className='mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl'>
            Keep a calmer inbox, finish more of what you save.
          </h2>
          <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-sm sm:text-base'>
            Start with a lightweight queue and grow into the features you need.
            No ads, no noise—just space for the ideas you are curious about.
          </p>
          <div className='mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button size='lg' className='w-full sm:w-auto sm:px-8'>
              {primaryCtaLabel}
            </Button>
            <Button variant='ghost' size='lg' className='w-full sm:w-auto'>
              {secondaryCtaLabel}
            </Button>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
