import { HighlightEditor } from '@/components/highlight-editor';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { renderHighlights, selectionRange } from '@/lib/highlights';
import type { CreateHighlight, Highlight, UpdateHighlight } from '@later/types';
import { Highlighter } from 'lucide-react';
import {
  type RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Measurable = {
  getBoundingClientRect: () => DOMRect;
  contextElement?: Element;
};

function highlightElement(root: HTMLElement | null, highlightId: string) {
  return root?.querySelector(
    `mark[data-highlight-id="${CSS.escape(highlightId)}"]`
  );
}

export function ArticleContent({
  content,
  highlights,
  activeHighlightId,
  onActiveHighlightChange,
  onCreateHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: {
  content: string;
  highlights: Highlight[];
  activeHighlightId: string | null;
  onActiveHighlightChange: (highlightId: string | null) => void;
  onCreateHighlight: (range: CreateHighlight) => void;
  onUpdateHighlight: (highlightId: string, update: UpdateHighlight) => void;
  onDeleteHighlight: (highlightId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<{
    range: CreateHighlight;
    anchor: RefObject<Measurable>;
  } | null>(null);

  useLayoutEffect(() => {
    const root = ref.current;

    if (root) {
      root.innerHTML = content;
      renderHighlights(root, highlights);
    }
  }, [content, highlights]);

  useLayoutEffect(() => {
    if (activeHighlightId) {
      highlightElement(ref.current, activeHighlightId)?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [activeHighlightId]);

  const active = highlights.find(
    (highlight) => highlight.highlight_id === activeHighlightId
  );

  const activeAnchor = useMemo<RefObject<Measurable>>(
    () => ({
      current: {
        getBoundingClientRect: () =>
          (activeHighlightId &&
            highlightElement(
              ref.current,
              activeHighlightId
            )?.getClientRects()[0]) ||
          new DOMRect(),
        get contextElement() {
          return ref.current ?? undefined;
        },
      },
    }),
    [activeHighlightId]
  );

  const select = () => {
    const current = window.getSelection();

    const range =
      ref.current && current && current.rangeCount > 0
        ? current.getRangeAt(0).cloneRange()
        : null;

    const highlightRange =
      range && ref.current ? selectionRange(ref.current, range) : null;

    setSelection(
      range && highlightRange
        ? {
            range: highlightRange,
            anchor: {
              current: {
                getBoundingClientRect: () => range.getBoundingClientRect(),
                contextElement: ref.current ?? undefined,
              },
            },
          }
        : null
    );
  };

  return (
    <>
      <div
        ref={ref}
        role='presentation'
        className='reader-content mt-10'
        onMouseUp={select}
        onKeyUp={select}
        onClick={(event) => {
          const mark = (event.target as Element).closest(
            'mark[data-highlight-id]'
          );

          if (
            mark instanceof HTMLElement &&
            window.getSelection()?.isCollapsed !== false
          ) {
            onActiveHighlightChange(mark.dataset.highlightId ?? null);
          }
        }}
      />
      <Popover
        open={selection !== null}
        onOpenChange={(open) => !open && setSelection(null)}
      >
        {selection && <PopoverAnchor virtualRef={selection.anchor} />}
        <PopoverContent
          side='top'
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              if (selection) {
                onCreateHighlight(selection.range);
              }
              window.getSelection()?.removeAllRanges();
              setSelection(null);
            }}
          >
            <Highlighter />
            Highlight
          </Button>
        </PopoverContent>
      </Popover>
      <Popover
        open={active !== undefined}
        onOpenChange={(open) => !open && onActiveHighlightChange(null)}
      >
        <PopoverAnchor virtualRef={activeAnchor} />
        <PopoverContent side='bottom' align='start'>
          {active && (
            <HighlightEditor
              key={active.highlight_id}
              highlight={active}
              onSave={(note) => {
                onUpdateHighlight(active.highlight_id, { note });
                onActiveHighlightChange(null);
              }}
              onDelete={() => {
                onDeleteHighlight(active.highlight_id);
                onActiveHighlightChange(null);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
