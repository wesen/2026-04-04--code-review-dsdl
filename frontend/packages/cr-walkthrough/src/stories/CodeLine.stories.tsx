import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CodeLine } from '../components/CodeLine';

const meta: Meta<typeof CodeLine> = {
  component: CodeLine,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CodeLine>;

export const Default: Story = {
  args: { num: 1, children: 'const x = 42;' },
};

export const WithLineNumber: Story = {
  args: { num: 42, children: 'const user = await verifyToken(token);' },
};

export const Highlighted: Story = {
  args: {
    num: 7,
    highlight: true,
    children: '    if (payload.exp < Date.now() / 1000) throw new Error("expired");',
  },
};

export const HighlightedCustomColor: Story = {
  args: {
    num: 7,
    highlight: true,
    highlightColor: '#5b9cf5',
    children: '    if (payload.exp < Date.now() / 1000) throw new Error("expired");',
  },
};

export const NoLineNumber: Story = {
  args: { num: null, children: '// This is a comment' },
};

export const Empty: Story = {
  args: { num: 5, children: '' },
};
