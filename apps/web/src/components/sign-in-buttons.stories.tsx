import { providers } from '../../.storybook/fixtures';
import preview from '../../.storybook/preview';
import { SignInButtons } from './sign-in-buttons';

const meta = preview.meta({
  component: SignInButtons,
  args: { providers },
  decorators: [
    (Story) => (
      <div className='flex flex-wrap items-center gap-3'>
        <Story />
      </div>
    ),
  ],
  title: 'Components/SignInButtons',
});

export const Default = meta.story({});

export const GitHubOnly = meta.story({ args: { providers: ['github'] } });

export const ExtraLarge = meta.story({ args: { size: 'xl' } });
