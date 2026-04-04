import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TextRenderer } from '../renderers/TextRenderer';
import type { TextStep } from '../types';

const meta: Meta<typeof TextRenderer> = {
  component: TextRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8, color: '#c8cad0' }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: TextStep }> = {
  render: (args) => <TextRenderer step={args.step} />,
  args: {
    step: {
      type: 'text',
      body: 'This PR replaces the legacy session-based auth with JWT tokens.\nWe\'ll walk through the changes bottom-up, starting at the token utility layer.',
    },
  },
};

export const SingleLine: StoryObj<{ step: TextStep }> = {
  render: (args) => <TextRenderer step={args.step} />,
  args: {
    step: { type: 'text', body: 'Quick one-liner note here.' },
  },
};

export const Empty: StoryObj<{ step: TextStep }> = {
  render: (args) => <TextRenderer step={args.step} />,
  args: {
    step: { type: 'text', body: '' },
  },
};

export const Multiline: StoryObj<{ step: TextStep }> = {
  render: (args) => <TextRenderer step={args.step} />,
  args: {
    step: {
      type: 'text',
      body: 'First paragraph with introductory text.\n\nSecond paragraph with more detail about the change being made in this PR.\n\nThird paragraph concluding with next steps.',
    },
  },
};
