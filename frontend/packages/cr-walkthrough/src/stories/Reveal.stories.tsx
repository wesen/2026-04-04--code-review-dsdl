import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { RevealRenderer } from '../renderers/RevealRenderer';
import type { RevealStep } from '../types';

const meta: Meta<typeof RevealRenderer> = {
  component: RevealRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 24, borderRadius: 8, maxWidth: 560 }}>
      <Story />
    </div>
  )],
};
export default meta;

const baseStep: RevealStep = {
  type: 'reveal',
  label: 'Show edge-case discussion',
  body: 'If the clock is skewed >30s, `exp` validation can reject valid tokens. We may want `clockTolerance` in the verify options.',
};

export const Default: StoryObj<{ step: RevealStep }> = {
  render: (args) => <RevealRenderer step={args.step} />,
  args: { step: baseStep },
};

export const LongContent: StoryObj<{ step: RevealStep }> = {
  render: (args) => <RevealRenderer step={args.step} />,
  args: {
    step: {
      type: 'reveal',
      label: 'Show full security analysis',
      body: `Security considerations:
1. Token expiry: validate exp claim before any business logic.
2. Algorithm confusion: reject 'none' algorithm.
3. Key rotation: cache public keys with TTL < 24h.
4. Replay attacks: store used jti claims in Redis with TTL = token lifetime.`,
    },
  },
};

export const ShortLabel: StoryObj<{ step: RevealStep }> = {
  render: (args) => <RevealRenderer step={args.step} />,
  args: {
    step: { type: 'reveal', label: 'Answer', body: 'The answer is 42.' },
  },
};

export const CodeBlock: StoryObj<{ step: RevealStep }> = {
  render: (args) => <RevealRenderer step={args.step} />,
  args: {
    step: {
      type: 'reveal',
      label: 'Show solution',
      body: `// Correct implementation:
const payload = verify(token, publicKey, { algorithms: ['RS256'] });
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}`,
    },
  },
};

export const MultiParagraph: StoryObj<{ step: RevealStep }> = {
  render: (args) => <RevealRenderer step={args.step} />,
  args: {
    step: {
      type: 'reveal',
      label: 'Show implementation notes',
      body: `First paragraph with a brief overview.

Second paragraph with more detail about the specific approach taken, including tradeoffs and alternative options considered.

Third paragraph with a call to action or next steps.`,
    },
  },
};
