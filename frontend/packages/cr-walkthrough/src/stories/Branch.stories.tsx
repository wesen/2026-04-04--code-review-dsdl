import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { BranchRenderer } from '../renderers/BranchRenderer';
import type { BranchStep } from '../types';

const meta: Meta<typeof BranchRenderer> = {
  component: BranchRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 24, borderRadius: 8, maxWidth: 560 }}>
      <Story />
    </div>
  )],
};
export default meta;

const baseStep: BranchStep = {
  type: 'branch',
  prompt: 'Choose a topic to explore:',
  options: [
    { label: 'Authentication flow', goto: 'step-2' },
    { label: 'Session vs JWT comparison', goto: 'step-4' },
    { label: 'Performance notes', goto: 'step-7' },
    { label: 'Security considerations', goto: 'step-10' },
  ],
};

export const Default: StoryObj<{ step: BranchStep }> = {
  render: (args) => (
    <BranchRenderer
      step={args.step}
      onSelect={(goto) => console.log('navigate to:', goto)}
    />
  ),
  args: { step: baseStep },
};

export const NoPrompt: StoryObj<{ step: BranchStep }> = {
  render: (args) => <BranchRenderer step={args.step} />,
  args: {
    step: {
      type: 'branch',
      options: [
        { label: 'Read more', goto: 'next' },
        { label: 'Skip to summary', goto: 'summary' },
      ],
    },
  },
};

export const SingleOption: StoryObj<{ step: BranchStep }> = {
  render: (args) => <BranchRenderer step={args.step} />,
  args: {
    step: {
      type: 'branch',
      prompt: 'Continue?',
      options: [{ label: 'Continue to next section', goto: 'next' }],
    },
  },
};

export const LongLabels: StoryObj<{ step: BranchStep }> = {
  render: (args) => <BranchRenderer step={args.step} />,
  args: {
    step: {
      type: 'branch',
      prompt: 'Which section would you like to explore next?',
      options: [
        { label: 'Deep dive: token verification and expiry validation', goto: 'step-10' },
        { label: 'Overview: why we migrated from sessions to JWT', goto: 'step-1' },
        { label: 'Performance analysis: latency impact of JWT verification', goto: 'step-15' },
      ],
    },
  },
};

export const TwoOptions: StoryObj<{ step: BranchStep }> = {
  render: (args) => <BranchRenderer step={args.step} />,
  args: {
    step: {
      type: 'branch',
      prompt: 'Show me the before or after?',
      options: [
        { label: 'Show before (sessions)', goto: 'before' },
        { label: 'Show after (JWT)', goto: 'after' },
      ],
    },
  },
};
