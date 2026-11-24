import { useState } from 'react';

import preview from '../../../.storybook/preview';
import { themes } from '../../../.storybook/themes';
import { VIEWS, type View } from '../../lib/library';
import { SegmentedControl } from './segmented-control';

function Example() {
  const [value, setValue] = useState<View>('inbox');

  return (
    <SegmentedControl
      className='w-80'
      label='Library'
      options={VIEWS}
      value={value}
      onValueChange={setValue}
    />
  );
}

const meta = preview.meta({
  component: Example,
  decorators: [themes],
  title: 'Components/SegmentedControl',
});

export const Default = meta.story({});
