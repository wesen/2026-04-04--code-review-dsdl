import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { StepCard } from '../renderers/StepCard';
import { StepRendererRegistry } from '../renderers/StepRendererRegistry';
import { PARTS } from '../parts';
import type { Step } from '../types';

const wrap = (story: React.ReactNode) => (
  <div style={{ background: '#101114', padding: 20, borderRadius: 8 }}>
    {story}
  </div>
);

// ── StepCard ───────────────────────────────────────────────────────

const cardMeta: Meta<typeof StepCard> = {
  component: StepCard,
  tags: ['autodocs'],
  decorators: [(Story) => wrap(<Story />)],
};
export default cardMeta;

export const CardText: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: { type: 'text', body: 'This PR replaces the legacy session-based auth with JWT tokens.' },
    index: '1',
  },
};

export const CardSource: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'source',
      file: 'src/utils/token.ts',
      lines: [12, 48],
      highlight: [30, 35],
      note: 'New verifyToken helper — note the fallback on L34.',
    },
    index: '2',
  },
};

export const CardDiff: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'diff',
      file: 'src/middleware/auth.ts',
      hunks: [2, 3],
      note: 'Session lookup replaced with verifyToken call.',
    },
    index: '3',
  },
};

export const CardCode: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'code',
      lang: 'typescript',
      body: '// Before\nconst user = await Session.find(req.cookie.sid);\n\n// After\nconst user = decodeJWT(req.headers.authorization);',
    },
    index: '4',
  },
};

export const CardCompare: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'compare',
      left: { file: 'src/routes/users.ts', ref: 'main', lines: [10, 30] },
      right: { file: 'src/routes/users.ts', ref: 'feat/cursor-pagination', lines: [10, 38] },
      note: 'Old offset vs new cursor approach side-by-side.',
    },
    index: '5',
  },
};

export const CardLink: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'link',
      url: 'https://jwt.io/introduction',
      label: 'JWT primer (external)',
    },
    index: '6',
  },
};

export const CardAnnotationInfo: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'annotation',
      file: 'src/middleware/auth.ts',
      line: 15,
      severity: 'info',
      body: 'Deprecation warning header added here.',
    },
    index: '7',
  },
};

export const CardAnnotationWarn: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'annotation',
      file: 'src/middleware/auth.ts',
      line: 42,
      severity: 'warn',
      body: 'Race condition if token refresh fires mid-request.',
    },
    index: '8',
  },
};

export const CardAnnotationIssue: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'annotation',
      file: 'src/utils/token.ts',
      line: 9,
      severity: 'issue',
      body: 'Unhandled rejection — needs a catch block.',
    },
    index: '9',
  },
};

export const CardAnnotationPraise: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'annotation',
      file: 'src/components/Profile.tsx',
      line: 8,
      severity: 'praise',
      body: 'Clean fix. Fallback string is a nice touch.',
    },
    index: '10',
  },
};

export const CardCheckpoint: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'checkpoint',
      prompt: 'What happens if the token is expired?',
      choices: [
        { text: 'Returns 401 Unauthorized', correct: true, explain: 'See L34 — the catch block returns early.' },
        { text: 'Falls back to session auth', correct: false, explain: 'Session fallback was removed in this PR.' },
        { text: 'Silently ignores the error', correct: false, explain: 'No — expired tokens always throw.' },
      ],
    },
    index: '11',
  },
};

export const CardReveal: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'reveal',
      label: 'Show edge-case discussion',
      body: 'If the clock is skewed >30s, `exp` validation can reject valid tokens. We may want `clockTolerance` in the verify options.',
    },
    index: '12',
  },
};

export const CardShell: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'shell',
      cmd: 'curl localhost:3000/users?limit=2',
      output: '{\n  "data": [{"id":1},{"id":2}],\n  "next_cursor": "eyJpZCI6Mn0="\n}',
      note: 'Response now includes a cursor token instead of page count.',
    },
    index: '13',
  },
};

export const CardSection: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
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
      ],
    },
    index: '14',
  },
};

export const CardBranch: StoryObj<{ step: Step; index: string }> = {
  render: (args) => <StepCard step={args.step} index={args.index} />,
  args: {
    step: {
      type: 'branch',
      prompt: 'Choose a topic to explore:',
      options: [
        { label: 'Authentication flow', goto: 'step-2' },
        { label: 'Session vs JWT comparison', goto: 'step-4' },
        { label: 'Performance notes', goto: 'step-7' },
      ],
    },
    index: '15',
  },
};
