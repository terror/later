import { articles, now } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { themes } from '../../.storybook/themes';
import { ArticleRow } from './article-row';

const meta = preview.meta({
  component: ArticleRow,
  args: { article: articles[0], now },
  decorators: [
    themes,
    (Story) => (
      <div className='w-[640px]'>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  title: 'Patterns/ArticleRow',
});

export const Default = meta.story({});

export const Active = meta.story({ args: { active: true } });

export const InProgress = meta.story({ args: { article: articles[2] } });

export const InProgressActive = meta.story({
  args: { article: articles[2], active: true },
});

export const Read = meta.story({ args: { article: articles[4] } });
