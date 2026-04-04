import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';

const meta: Meta<typeof CodeBlock> = {
  component: CodeBlock,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CodeBlock>;

// ── Variants ──────────────────────────────────────────────────────

const SAMPLE_LINES = [
  'export function createToken(payload: unknown): string {',
  '  const header = base64(JSON.stringify({ alg: "HS256", typ: "JWT" }));',
  '  const body   = base64(JSON.stringify({ ...payload, iat: Date.now() }));',
  '  const sig    = hmac(`${header}.${body}`, SECRET);',
  '  return `${header}.${body}.${sig}`;',
  '}',
];

export const Default: Story = {
  render: () => (
    <CodeBlock>
      {SAMPLE_LINES.map((l, i) => (
        <CodeLine key={i} num={i + 1}>{l}</CodeLine>
      ))}
    </CodeBlock>
  ),
};

export const NoLines: Story = {
  render: () => <CodeBlock />,
};

export const SingleLine: Story = {
  render: () => (
    <CodeBlock>
      <CodeLine num={1}>const VERSION = "1.0.0";</CodeLine>
    </CodeBlock>
  ),
};

export const ManyLines: Story = {
  render: () => (
    <CodeBlock>
      {Array.from({ length: 30 }, (_, i) => (
        <CodeLine key={i} num={i + 1}>{`function line${i + 1}() {}`}</CodeLine>
      ))}
    </CodeBlock>
  ),
};

export const WithoutRoundedBottom: Story = {
  render: () => (
    <CodeBlock rounded={false}>
      <CodeLine num={1}>import { useState } from "react";</CodeLine>
    </CodeBlock>
  ),
};
