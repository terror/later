import type { Highlight } from '@later/types';
import type { CSSProperties } from 'react';

export function HighlightList({
  highlights,
  onSelect,
}: {
  highlights: Highlight[];
  onSelect: (highlight: Highlight) => void;
}) {
  return (
    <section aria-label='Highlights' className='flex flex-col gap-2.5'>
      <h3 className='text-muted-foreground text-[13px]'>
        Highlights
        {highlights.length > 0 && ` · ${highlights.length}`}
      </h3>
      {highlights.length === 0 ? (
        <p className='text-faint text-[13px]'>
          Select text in the article to highlight it.
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {highlights.map((highlight) => (
            <li key={highlight.highlight_id}>
              <button
                type='button'
                onClick={() => onSelect(highlight)}
                className='bg-background hover:bg-muted focus-visible:ring-ring/30 flex w-full cursor-pointer flex-col gap-1.5 rounded-xl p-3.5 text-left text-[13px] leading-relaxed transition-colors outline-none focus-visible:ring-2'
              >
                <span className='line-clamp-4'>
                  <mark
                    className='highlight'
                    style={{ '--highlight': highlight.color } as CSSProperties}
                  >
                    {highlight.selected_text}
                  </mark>
                </span>
                {highlight.note && (
                  <span className='text-muted-foreground'>
                    {highlight.note}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
