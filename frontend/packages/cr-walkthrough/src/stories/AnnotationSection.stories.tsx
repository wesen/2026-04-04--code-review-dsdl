import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AnnotationRenderer } from '../renderers/AnnotationRenderer';
import type { AnnotationStep, AnnotationSeverity } from '../types';

const wrap = (story: React.ReactNode) => (
  <div style={{ background: '#101114', padding: 24, borderRadius: 8 }}>
    {story}
  </div>
);

// ── Annotation ──────────────────────────────────────────────────────

const annotationMeta: Meta<typeof AnnotationRenderer> = {
  component: AnnotationRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => wrap(<Story />)],
};
export default annotationMeta;

const baseStep: AnnotationStep = {
  type: 'annotation',
  file: 'src/middleware/auth.ts',
  line: 42,
  body: 'Race condition if token refresh fires mid-request.',
};

export const AnnotationInfo: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: { ...baseStep, severity: 'info' as AnnotationSeverity, line: 15, body: 'Deprecation warning header added here.' },
  },
};

export const AnnotationWarn: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: { ...baseStep, severity: 'warn' as AnnotationSeverity },
  },
};

export const AnnotationIssue: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: { ...baseStep, severity: 'issue' as AnnotationSeverity, line: 9, body: 'Unhandled rejection — needs a catch block.' },
  },
};

export const AnnotationPraise: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: { ...baseStep, severity: 'praise' as AnnotationSeverity, line: 8, body: 'Clean fix. Fallback string is a nice touch.' },
  },
};

export const AnnotationLongBody: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: {
      type: 'annotation',
      file: 'src/utils/token.ts',
      line: 1,
      severity: 'warn',
      body: 'The clock skew tolerance is hardcoded to 30 seconds. If server clocks drift more than this, valid tokens may be rejected. Consider making this configurable per deployment.',
    },
  },
};

export const AnnotationShort: StoryObj<{ step: AnnotationStep }> = {
  render: (args) => <AnnotationRenderer step={args.step} />,
  args: {
    step: { type: 'annotation', file: 'a.ts', line: 1, severity: 'info', body: 'TODO: add tests.' },
  },
};

// ── Source renderer (with mocked RTK query) ───────────────────────
// SourceRenderer calls useGetFileContentQuery — we mock it via the store in preview.tsx.
// These stories use the pre-seeded fixture data from preview.tsx.

export const SourceRendererStory: StoryObj = {
  name: 'SourceRenderer (from fixture)',
  decorators: [
    (Story) => (
      <div style={{ background: '#101114', padding: 20, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  render: () => {
    const { SourceRenderer } = require('../renderers/SourceRenderer');
    return (
      <SourceRenderer
        step={{
          type: 'source',
          file: 'src/utils/token.ts',
          lines: [12, 48],
          highlight: [30, 35],
          ref: 'feat/auth-refactor',
        }}
      />
    );
  },
};

export const SourceRendererLongFile: StoryObj = {
  name: 'SourceRenderer — long file path',
  decorators: [
    (Story) => (
      <div style={{ background: '#101114', padding: 20, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  render: () => {
    const { SourceRenderer } = require('../renderers/SourceRenderer');
    return (
      <SourceRenderer
        step={{
          type: 'source',
          file: 'src/features/auth/middleware/verifyToken.ts',
          lines: [1, 20],
          highlight: [5, 10],
        }}
      />
    );
  },
};

export const SourceRendererNoHighlight: StoryObj = {
  name: 'SourceRenderer — no highlight',
  decorators: [
    (Story) => (
      <div style={{ background: '#101114', padding: 20, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  render: () => {
    const { SourceRenderer } = require('../renderers/SourceRenderer');
    return (
      <SourceRenderer
        step={{
          type: 'source',
          file: 'src/config.ts',
          lines: [1, 10],
        }}
      />
    );
  },
};

export const SourceRendererWithNote: StoryObj = {
  name: 'SourceRenderer — with note',
  decorators: [
    (Story) => (
      <div style={{ background: '#101114', padding: 20, borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  render: () => {
    const { SourceRenderer } = require('../renderers/SourceRenderer');
    return (
      <SourceRenderer
        step={{
          type: 'source',
          file: 'src/utils/token.ts',
          lines: [12, 48],
          highlight: [30, 35],
          note: 'New verifyToken helper — note the fallback on L34.',
        }}
      />
    );
  },
};
