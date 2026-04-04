import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileContentQuery } from '../api/walkthroughsApi';
import type { CompareStep } from '../types';

interface SideProps {
  label: string;
  file: string;
  ref: string;
  lines: [number, number];
  accentColor: string;
}

const SidePane: React.FC<SideProps> = ({ label, file, ref, lines, accentColor }) => {
  const { data, isLoading } = useGetFileContentQuery(
    { ref, path: file, start: lines[0], end: lines[1] },
    { skip: !ref }
  );

  return (
    <div
      data-part={PARTS.SIDE_PANE}
      style={{ flex: 1, minWidth: 0 }}
    >
      <div
        data-part={PARTS.SIDE_PANE_LABEL}
        style={{
          fontSize: 'var(--cr-font-size-xs)',
          fontWeight: 'var(--cr-font-weight-bold)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--cr-color-text-subtle)',
          marginBottom: 'var(--cr-space-1)',
        }}
      >
        {label}
      </div>
      <FileBadge
        file={file}
        meta={`${ref} L${lines[0]}–${lines[1]}`}
      />
      <CodeBlock rounded>
        {isLoading && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-text-subtle)' }}>Loading…</span>
          </CodeLine>
        )}
        {data?.lines.map((line, i) => (
          <CodeLine key={i} num={lines[0] + i} highlightColor={accentColor}>
            <span style={{ opacity: 0.2 }}>{line}</span>
          </CodeLine>
        ))}
      </CodeBlock>
    </div>
  );
};

interface Props {
  step: CompareStep;
}

export const CompareRenderer: React.FC<Props> = ({ step }) => (
  <div data-part={PARTS.COMPARE_STEP}>
    <div
      data-part={PARTS.SIDE_BY_SIDE}
      style={{ display: 'flex', gap: 'var(--cr-space-3)' }}
    >
      <SidePane
        label="before"
        file={step.left.file}
        ref={step.left.ref || 'main'}
        lines={step.left.lines}
        accentColor="var(--cr-color-diff-del-text)"
      />
      <SidePane
        label="after"
        file={step.right.file}
        ref={step.right.ref || 'HEAD'}
        lines={step.right.lines}
        accentColor="var(--cr-color-diff-add-text)"
      />
    </div>
    {step.note && <Note>{step.note}</Note>}
  </div>
);
