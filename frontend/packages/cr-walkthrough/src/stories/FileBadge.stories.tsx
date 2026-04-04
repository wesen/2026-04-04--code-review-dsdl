import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FileBadge } from '../components/FileBadge';

const meta: Meta<typeof FileBadge> = {
  component: FileBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;
type Story = StoryObj<typeof FileBadge>;

// ── Variants ──────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    file: 'src/utils/token.ts',
    meta: 'L12–48',
  },
};

export const LongPath: Story = {
  args: {
    file: 'src/features/auth/middleware/verifyToken.ts',
    meta: 'L1–100',
  },
};

export const NoMeta: Story = {
  args: {
    file: 'src/app.ts',
  },
};

export const MetaOnly: Story = {
  args: {
    file: 'snippet',
    meta: 'typescript',
  },
};
