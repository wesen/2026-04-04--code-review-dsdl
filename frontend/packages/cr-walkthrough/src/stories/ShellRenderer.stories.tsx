import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ShellRenderer } from '../renderers/ShellRenderer';
import type { ShellStep } from '../types';

const meta: Meta<typeof ShellRenderer> = {
  component: ShellRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'curl localhost:3000/users?limit=2',
      output: '{\n  "data": [{"id":1},{"id":2}],\n  "next_cursor": "eyJpZCI6Mn0="\n}',
    },
  },
};

export const WithNote: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'npm test -- --coverage',
      output: 'PASS  src/auth.test.ts\n\ncoverage: 87.3%',
      note: 'All auth tests pass with good coverage.',
    },
  },
};

export const OutputOnly: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'git log --oneline -5',
      output: 'a1b2c3d feat: add auth middleware\ne2f3g4h fix: null check\nm3n4o5p docs: update README',
    },
  },
};

export const MultilineOutput: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'cat package.json',
      output: '{\n  "name": "api",\n  "version": "2.0.0",\n  "dependencies": {\n    "express": "^4.18.0"\n  }\n}',
    },
  },
};

export const ErrorOutput: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'npm run build',
      output: 'Error: Cannot find module \'./auth\'\n    at resolve (/src/middleware/auth.ts:1)',
    },
  },
};

export const LongCommand: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'npx wrangler pages deploy dist/ --project-name=acme-backend --branch=preview --git-source=main',
      output: 'Success! Your deployment is live at:\nhttps://acme-backend.preview.pages.dev',
    },
  },
};

export const JsonOutput: StoryObj<{ step: ShellStep }> = {
  render: (args) => <ShellRenderer step={args.step} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'curl -s https://api.example.com/health | jq',
      output: '{\n  "status": "ok",\n  "uptime": 86400,\n  "version": "2.0.0"\n}',
    },
  },
};
