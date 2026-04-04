import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DiffRenderer } from '../renderers/DiffRenderer';
import type { DiffStep } from '../types';

const meta: Meta<typeof DiffRenderer> = {
  component: DiffRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: DiffStep }> = {
  render: (args) => <DiffRenderer step={args.step} />,
  args: {
    step: {
      type: 'diff',
      file: 'src/middleware/auth.ts',
      hunks: [2, 3],
      note: 'Session lookup replaced with verifyToken call.',
    },
  },
};

export const NoNote: StoryObj<{ step: DiffStep }> = {
  render: (args) => <DiffRenderer step={args.step} />,
  args: {
    step: {
      type: 'diff',
      file: 'src/utils/token.ts',
      hunks: [1],
    },
  },
};

export const SmallDiff: StoryObj<{ step: DiffStep }> = {
  render: (args) => <DiffRenderer step={args.step} />,
  args: {
    step: {
      type: 'diff',
      file: 'src/components/Profile.tsx',
      hunks: [1],
      note: 'Added optional chaining.',
    },
  },
};
