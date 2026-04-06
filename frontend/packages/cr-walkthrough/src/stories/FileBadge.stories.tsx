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

// ── Interactive (cross-linking) variants ───────────────────────────

export const Interactive: Story = {
  name: 'Interactive — file badge with onClick',
  args: {
    file: 'src/utils/token.ts',
    meta: 'L12–48',
    ref_: 'feat/auth-refactor',
    interactive: true,
    onClick: () => alert('Open FileViewer at this file range'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `interactive` and `onClick` are provided, the badge is styled as a clickable link. ' +
          'The file path is underlined and the cursor changes to pointer. ' +
          'Clicking calls `onOpenFile` to open the FileViewer.',
      },
    },
  },
};

export const InteractiveWithRef: Story = {
  name: 'Interactive with ref — shows branch/commit ref',
  args: {
    file: 'src/middleware/auth.ts',
    meta: 'L30–60',
    ref_: 'feat/auth-refactor',
    interactive: true,
    onClick: () => {},
  },
};
