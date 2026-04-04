import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LinkRenderer } from '../renderers/LinkRenderer';
import type { LinkStep } from '../types';

const meta: Meta<typeof LinkRenderer> = {
  component: LinkRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: LinkStep }> = {
  render: (args) => <LinkRenderer step={args.step} />,
  args: {
    step: {
      type: 'link',
      url: 'https://jwt.io/introduction',
      label: 'JWT primer (external)',
    },
  },
};

export const NoLabel: StoryObj<{ step: LinkStep }> = {
  render: (args) => <LinkRenderer step={args.step} />,
  args: {
    step: { type: 'link', url: 'https://example.com' },
  },
};

export const GitHubPR: StoryObj<{ step: LinkStep }> = {
  render: (args) => <LinkRenderer step={args.step} />,
  args: {
    step: {
      type: 'link',
      url: 'https://github.com/acme/backend/pull/482',
      label: 'View PR #482',
    },
  },
};

export const Documentation: StoryObj<{ step: LinkStep }> = {
  render: (args) => <LinkRenderer step={args.step} />,
  args: {
    step: {
      type: 'link',
      url: 'https://docs.example.com/auth/jwt',
      label: 'JWT authentication docs',
    },
  },
};
