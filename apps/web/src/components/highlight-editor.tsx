import { Button } from '@/components/ui/button';
import type { Highlight } from '@later/types';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export function HighlightEditor({
  highlight,
  onSave,
  onDelete,
}: {
  highlight: Highlight;
  onSave: (note: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(highlight.note ?? '');

  return (
    <form
      className='flex w-72 flex-col gap-1.5'
      onSubmit={(event) => {
        event.preventDefault();
        onSave(note.trim());
      }}
    >
      <textarea
        aria-label='Note'
        placeholder='Add a note…'
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
        className='w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring/30'
      />
      <div className='flex justify-between gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Delete highlight'
          title='Delete highlight'
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
        <Button type='submit' size='sm'>
          Save
        </Button>
      </div>
    </form>
  );
}
