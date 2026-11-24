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
