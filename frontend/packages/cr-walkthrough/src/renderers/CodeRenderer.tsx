import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import type { CodeStep } from '../types';

interface Props {
  step: CodeStep;
}

export const CodeRenderer: React.FC<Props> = ({ step }) => {
  const lines = step.body.split('\n');
  return (
    <div data-part={PARTS.CODE_STEP}>
      <FileBadge file="snippet" meta={step.lang} />
      <CodeBlock>
        {lines.map((line, i) => (
          <CodeLine key={i} num={i + 1}>
            <span
              style={{
                color:
                  line.trimStart().startsWith('//') ||
                  line.trimStart().startsWith('#')
                    ? 'var(--cr-color-text-subtle)'
                    : 'var(--cr-color-text)',
              }}
            >
              {line}
            </span>
          </CodeLine>
        ))}
      </CodeBlock>
      {step.note && <Note>{step.note}</Note>}
    </div>
  );
};
