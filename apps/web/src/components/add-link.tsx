import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function AddLink({
  onAdd,
  defaultOpen = false,
}: {
  onAdd: (url: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const [url, setUrl] = useState('');

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    setUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label='Add link' title='Add link'>
          <Plus />
          <span className='hidden md:inline'>Add link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-xl border-none sm:max-w-md'>
        <form
          className='flex flex-col gap-5'
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(url.trim());
            onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className='text-[17px] tracking-[-0.02em]'>
              Add a link
            </DialogTitle>
            <DialogDescription>
              The page is fetched and saved to your library.
            </DialogDescription>
          </DialogHeader>
          <input
            type='url'
            required
            aria-label='URL'
            placeholder='https://'
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className='h-9 rounded-lg bg-card px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/15'
          />
          <DialogFooter>
            <Button type='submit'>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
