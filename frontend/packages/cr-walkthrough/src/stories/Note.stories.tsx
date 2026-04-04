import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Note } from '../components/Note';

const meta: Meta<typeof Note> = {
  component: Note,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Note>;

export const Default: Story = {
  args: {
    children: 'Note the fallback on L34.',
  },
};

export const MultiLine: Story = {
  args: {
    children: 'This code path is intentionally left blank.\nSee the architecture doc for rationale.',
  },
};

export const CodeInNote: Story = {
  args: {
    children: 'Always check payload.exp < Date.now() before calling verifyToken.',
  },
};
