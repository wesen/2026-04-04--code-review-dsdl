import React from 'react';
import { PARTS } from '../parts';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import type { ShellStep } from '../types';

interface Props {
  step: ShellStep;
}

export const ShellRenderer: React.FC<Props> = ({ step }) => (
  <div data-part={PARTS.SHELL_STEP}>
    <CodeBlock>
      <CodeLine num={null}>
        <span style={{ color: 'var(--cr-color-shell-step)' }}>$ </span>
        <span>{step.cmd}</span>
      </CodeLine>
      {step.output &&
        step.output.split('\n').map((line, i) => (
          <CodeLine key={i} num={null}>
            <span style={{ opacity: 0.65 }}>{line}</span>
          </CodeLine>
        ))}
    </CodeBlock>
    {step.note && <Note>{step.note}</Note>}
  </div>
);
