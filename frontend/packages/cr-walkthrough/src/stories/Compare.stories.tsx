import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CompareRenderer } from '../renderers/CompareRenderer';
import type { CompareStep } from '../types';

const meta: Meta<typeof CompareRenderer> = {
  component: CompareRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: CompareStep }> = {
  render: (args) => <CompareRenderer step={args.step} />,
  args: {
    step: {
      type: 'compare',
      left: { file: 'src/routes/users.ts', ref: 'main', lines: [10, 30] },
      right: { file: 'src/routes/users.ts', ref: 'feat/cursor-pagination', lines: [10, 38] },
      note: 'Old offset vs new cursor approach side-by-side.',
    },
  },
};

export const WithNote: StoryObj<{ step: CompareStep }> = {
  render: (args) => <CompareRenderer step={args.step} />,
  args: {
    step: {
      type: 'compare',
      left: { file: 'src/auth/session.ts', ref: 'main', lines: [1, 15] },
      right: { file: 'src/auth/jwt.ts', ref: 'feat/jwt', lines: [1, 20] },
      note: 'Session-based approach vs JWT approach. JWT removes the server-side session store.',
    },
  },
};

export const DifferentFiles: StoryObj<{ step: CompareStep }> = {
  render: (args) => <CompareRenderer step={args.step} />,
  args: {
    step: {
      type: 'compare',
      left: { file: 'lib/legacy/pagination.ts', ref: 'main', lines: [1, 20] },
      right: { file: 'lib/cursor/pagination.ts', ref: 'feat/cursor', lines: [1, 20] },
      note: 'The new cursor paginator lives in a separate module.',
    },
  },
};
