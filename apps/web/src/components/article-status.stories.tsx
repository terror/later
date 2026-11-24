import preview from '../../.storybook/preview';
import { themes } from '../../.storybook/themes';
import { ArticleStatus } from './article-status';

const meta = preview.meta({
  component: ArticleStatus,
  args: { className: 'text-muted-foreground text-[13px]' },
  decorators: [themes],
  title: 'Patterns/ArticleStatus',
});

export const Pending = meta.story({ args: { status: 'pending' } });

export const Failed = meta.story({ args: { status: 'failed' } });
