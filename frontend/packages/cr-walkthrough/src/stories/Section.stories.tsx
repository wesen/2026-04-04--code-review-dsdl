import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SectionRenderer } from '../renderers/SectionRenderer';
import type { SectionStep } from '../types';

const meta: Meta<typeof SectionRenderer> = {
  component: SectionRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: SectionStep }> = {
  render: (args) => <SectionRenderer step={args.step} />,
  args: {
    step: {
      type: 'section',
      title: 'Migration notes',
      id: 'migration',
      steps: [
        { type: 'text', body: 'All clients must update to use `cursor` instead of `page`.' },
        {
          type: 'annotation',
          file: 'src/routes/users.ts',
          line: 15,
          severity: 'info',
          body: 'Deprecation warning header added here.',
        },
        { type: 'text', body: 'All existing integrations will need to be updated.' },
      ],
    },
  },
};

export const WithDiff: StoryObj<{ step: SectionStep }> = {
  render: (args) => <SectionRenderer step={args.step} />,
  args: {
    step: {
      type: 'section',
      title: 'Changes in this PR',
      steps: [
        { type: 'text', body: 'Three files were modified.' },
        { type: 'source', file: 'src/auth/token.ts', lines: [1, 10], note: 'Core token logic.' },
        { type: 'diff', file: 'src/middleware/auth.ts', hunks: [1], note: 'Entry point change.' },
      ],
    },
  },
};

export const Nested: StoryObj<{ step: SectionStep }> = {
  render: (args) => <SectionRenderer step={args.step} depth={0} />,
  args: {
    step: {
      type: 'section',
      title: 'Overview',
      steps: [
        { type: 'text', body: 'Top-level overview text.' },
        {
          type: 'section',
          title: 'Detailed notes',
          steps: [
            { type: 'text', body: 'Nested section text (depth 1).' },
            {
              type: 'section',
              title: 'Deep dive',
              steps: [
                { type: 'text', body: 'Deepest nested text (depth 2).' },
              ],
            },
          ],
        },
        { type: 'text', body: 'Back to top-level after nested.' },
      ],
    },
  },
};

export const WithBranch: StoryObj<{ step: SectionStep }> = {
  render: (args) => <SectionRenderer step={args.step} />,
  args: {
    step: {
      type: 'section',
      title: 'Next steps',
      steps: [
        { type: 'text', body: 'Choose a path to continue exploring.' },
        {
          type: 'branch',
          prompt: 'What would you like to do next?',
          options: [
            { label: 'Explore the tests', goto: 'tests' },
            { label: 'Read the architecture doc', goto: 'arch' },
            { label: 'Jump to the summary', goto: 'summary' },
          ],
        },
      ],
    },
  },
};
