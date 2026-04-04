import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CheckpointRenderer } from '../renderers/CheckpointRenderer';
import type { CheckpointStep } from '../types';

const meta: Meta<typeof CheckpointRenderer> = {
  component: CheckpointRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 24, borderRadius: 8, maxWidth: 560 }}>
      <Story />
    </div>
  )],
};
export default meta;

const baseStep: CheckpointStep = {
  type: 'checkpoint',
  prompt: 'What happens if the token is expired?',
  choices: [
    { text: 'Returns 401 Unauthorized', correct: true, explain: 'See L34 — the catch block returns early.' },
    { text: 'Falls back to session auth', correct: false, explain: 'Session fallback was removed in this PR.' },
    { text: 'Silently ignores the error', correct: false, explain: 'No — expired tokens always throw.' },
  ],
};

export const Default: StoryObj<{ step: CheckpointStep }> = {
  render: (args) => <CheckpointRenderer step={args.step} />,
  args: { step: baseStep },
};

export const With4Choices: StoryObj<{ step: CheckpointStep }> = {
  render: (args) => <CheckpointRenderer step={args.step} />,
  args: {
    step: {
      type: 'checkpoint',
      prompt: 'Which of these is true about cursor pagination?',
      choices: [
        { text: 'Cursors point to a stable row', correct: true, explain: 'Exactly — offset N can shift when rows are added.' },
        { text: 'It uses less memory', correct: false, explain: 'Memory usage is similar.' },
        { text: 'It requires a primary key', correct: false, explain: 'Not strictly — you can paginate on any column.' },
        { text: 'It always returns the same results', correct: false, explain: 'Data can change between requests.' },
      ],
    },
  },
};

export const LongPrompt: StoryObj<{ step: CheckpointStep }> = {
  render: (args) => <CheckpointRenderer step={args.step} />,
  args: {
    step: {
      type: 'checkpoint',
      prompt: 'Given the code change shown above, what is the most likely runtime behaviour when a user visits /dashboard without providing an Authorization header?',
      choices: [
        { text: 'Returns HTTP 401 with body { "error": "Unauthorized" }', correct: true, explain: 'The middleware returns early on line 42.' },
        { text: 'Returns HTTP 403 Forbidden', correct: false, explain: '401 is used for missing authentication.' },
        { text: 'Throws an unhandled exception', correct: false, explain: 'The try/catch handles this case.' },
      ],
    },
  },
};
