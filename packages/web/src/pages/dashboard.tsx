import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useAuth } from '@/hooks/use-auth';
import { getLogoutUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';
import { useMemo, useState } from 'react';

type TabKey = 'inbox' | 'archive';

type ArticleStatus = 'Unread' | 'In Progress' | 'Completed';

type Article = {
  id: number;
  title: string;
  description?: string;
  url?: string;
  source?: string;
  addedAt?: string;
  timeToRead?: string;
  notes?: string;
  tags?: string[];
  status?: ArticleStatus;
};

const statusStyles: Record<ArticleStatus, string> = {
  Unread: 'bg-primary/10 text-primary',
  'In Progress':
    'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200',
  Completed:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const [articlesByTab, setArticlesByTab] = useState<Record<TabKey, Article[]>>(
    {
      inbox: [],
      archive: [],
    }
  );

  const [activeTab, setActiveTab] = useState<TabKey>('inbox');

  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    null
  );

  const articles = articlesByTab[activeTab];

  const effectiveSelectedArticleId = useMemo(() => {
    if (
      selectedArticleId !== null &&
      articles.some((article) => article.id === selectedArticleId)
    ) {
      return selectedArticleId;
    }

    return articles[0]?.id ?? null;
  }, [articles, selectedArticleId]);

  const selectedArticle = useMemo(() => {
    return (
      articles.find((article) => article.id === effectiveSelectedArticleId) ??
      null
    );
  }, [articles, effectiveSelectedArticleId]);

  const displayName =
    user?.name && user.name.trim().length > 0 ? user.name : 'Taylor Dawson';

  const avatarInitials = useMemo(() => {
    const fallback = 'TD';

    if (!displayName) {
      return fallback;
    }

    const letters = displayName
      .split(' ')
      .filter(Boolean)
      .map((segment) => segment[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);

    return letters || fallback;
  }, [displayName]);
  const handleLogout = () => {
    window.location.href = getLogoutUrl();
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const handleArticleSelect = (articleId: number) => {
    setSelectedArticleId(articleId);
  };

  const handleMoveToArchive = () => {
    if (!selectedArticle || activeTab !== 'inbox') {
      return;
    }

    setArticlesByTab((previous) => {
      const inbox = previous.inbox.filter(
        (article) => article.id !== selectedArticle.id
      );

      const alreadyArchived = previous.archive.some(
        (article) => article.id === selectedArticle.id
      );

      return {
        inbox,
        archive: alreadyArchived
          ? previous.archive
          : [selectedArticle, ...previous.archive],
      };
    });
  };

  const handleOpenArticle = (url?: string) => {
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const columnWrapperClasses =
    'flex h-full flex-col overflow-hidden border-border/60 bg-background backdrop-blur';

  return (
    <>
      <div className='bg-background text-foreground flex h-screen w-screen overflow-hidden'>
        <aside className={cn(columnWrapperClasses, 'w-[260px] border-r')}>
          <div className='px-6 pb-6 pt-8'>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
              later
            </p>
            <h1 className='mt-1 text-xl font-semibold'>Dashboard</h1>
          </div>
          <nav className='flex flex-col gap-1 px-3'>
            {(Object.keys(articlesByTab) as TabKey[]).map((tab) => (
              <button
                key={tab}
                type='button'
                onClick={() => handleTabChange(tab)}
                className={cn(
                  'focus-visible:ring-ring flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2',
                  activeTab === tab
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                )}
              >
                <span className='capitalize'>{tab}</span>
                <span className='text-muted-foreground text-xs'>
                  {articlesByTab[tab].length}
                </span>
              </button>
            ))}
          </nav>
          <div className='border-border/60 bg-muted/5 mt-auto flex flex-col gap-3 border-t px-4 py-5'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='ghost' className='w-full justify-start gap-2'>
                  <Settings className='size-4' />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Manage your reading preferences and integrations.
                  </DialogDescription>
                </DialogHeader>
                <div className='text-muted-foreground space-y-4 text-sm'>
                  <p>• Daily digest delivery window</p>
                  <p>• Preferred reading theme</p>
                  <p>• Sync integrations</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='ghost' className='w-full sm:w-auto'>
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button className='w-full sm:w-auto'>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  type='button'
                  className='bg-background/80 hover:border-border/70 hover:bg-background focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2'
                >
                  <div className='from-primary/70 to-primary text-primary-foreground flex size-10 items-center justify-center rounded-full bg-gradient-to-br font-semibold'>
                    {avatarInitials}
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium leading-tight'>
                      {displayName}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      View profile
                    </span>
                  </div>
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side='right'
                align='start'
                className='space-y-3'
              >
                <div>
                  <p className='text-muted-foreground text-xs font-semibold uppercase'>
                    Profile
                  </p>
                </div>
                <Button
                  variant='ghost'
                  className='text-destructive hover:text-destructive w-full justify-start'
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </HoverCardContent>
            </HoverCard>
          </div>
        </aside>
        <main className={cn(columnWrapperClasses, 'flex-1 border-r')}>
          <div className='border-border/60 flex items-center justify-between border-b px-6 py-4'>
            <div>
              <h2 className='text-lg font-semibold capitalize'>{activeTab}</h2>
              <p className='text-muted-foreground text-sm'>
                {articles.length} saved item{articles.length === 1 ? '' : 's'}
              </p>
            </div>
            <span className='text-muted-foreground text-xs'>
              Updated a moment ago
            </span>
          </div>
          <div className='flex-1 overflow-y-auto px-4 py-6'>
            {articles.length === 0 ? (
              <div className='border-border/60 bg-muted/10 text-muted-foreground flex h-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center text-sm'>
                <p>No saved items yet.</p>
                <p className='mt-2'>
                  Drop an article into the {activeTab} tab to see it listed
                  here.
                </p>
              </div>
            ) : (
              <div className='space-y-2'>
                {articles.map((article) => (
                  <button
                    key={article.id}
                    type='button'
                    onClick={() => handleArticleSelect(article.id)}
                    className={cn(
                      'bg-muted/10 hover:border-border/60 hover:bg-muted/20 focus-visible:ring-ring w-full rounded-xl border border-transparent px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2',
                      selectedArticle?.id === article.id &&
                        'border-primary/50 bg-primary/10'
                    )}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-sm font-semibold'>{article.title}</p>
                        {article.description && (
                          <p className='text-muted-foreground mt-1 text-sm'>
                            {article.description}
                          </p>
                        )}
                        {article.source && (
                          <p className='text-muted-foreground mt-2 text-xs uppercase tracking-wide'>
                            {article.source}
                          </p>
                        )}
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        {article.addedAt && (
                          <span className='text-muted-foreground text-xs'>
                            {article.addedAt}
                          </span>
                        )}
                        {article.status && (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                              statusStyles[article.status]
                            )}
                          >
                            {article.status}
                          </span>
                        )}
                        {article.timeToRead && (
                          <span className='text-muted-foreground text-xs'>
                            {article.timeToRead}
                          </span>
                        )}
                      </div>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {article.tags.map((tag) => (
                          <span
                            key={`${article.id}-${tag}`}
                            className='bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs'
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
        <section className={cn(columnWrapperClasses, 'w-[340px]')}>
          {selectedArticle ? (
            <>
              <div className='border-border/60 flex flex-col gap-3 border-b px-6 pb-5 pt-6'>
                {selectedArticle.status ? (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize',
                      statusStyles[selectedArticle.status]
                    )}
                  >
                    {selectedArticle.status}
                  </span>
                ) : (
                  <span className='bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-xs font-medium'>
                    Uncategorized
                  </span>
                )}
                <div>
                  <h3 className='text-xl font-semibold'>
                    {selectedArticle.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {[selectedArticle.source, selectedArticle.timeToRead]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                  {selectedArticle.addedAt && (
                    <p className='text-muted-foreground text-xs'>
                      Added {selectedArticle.addedAt}
                    </p>
                  )}
                </div>
              </div>
              <div className='text-muted-foreground flex-1 overflow-y-auto px-6 py-5 text-sm leading-6'>
                {selectedArticle.notes &&
                selectedArticle.notes.trim().length > 0 ? (
                  selectedArticle.notes
                    .split('\n\n')
                    .map((paragraph, index) => (
                      <p key={`${selectedArticle.id}-${index}`}>{paragraph}</p>
                    ))
                ) : (
                  <p>No notes saved for this article yet.</p>
                )}
              </div>
              <div className='border-border/60 flex justify-end gap-3 border-t px-6 pb-6 pt-4'>
                <Button
                  variant='ghost'
                  onClick={handleMoveToArchive}
                  disabled={!selectedArticle || activeTab !== 'inbox'}
                >
                  Move to Archive
                </Button>
                <Button
                  onClick={() => handleOpenArticle(selectedArticle.url)}
                  disabled={!selectedArticle.url}
                >
                  Open Article
                </Button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
