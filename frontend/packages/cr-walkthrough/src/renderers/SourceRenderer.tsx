import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileContentQuery } from '../api/walkthroughsApi';
import type { SourceStep } from '../types';

interface Props {
  step: SourceStep;
  /** Override the default git ref (defaults to walkthrough head) */
  refOverride?: string;
  accentColor?: string;
}

export const SourceRenderer: React.FC<Props> = ({
  step,
  refOverride,
  accentColor,
}) => {
  const ref = refOverride || step.ref || 'HEAD';
  const { data, isLoading, isError, error } = useGetFileContentQuery({
    ref,
    path: step.file,
    start: step.lines[0],
    end: step.lines[1],
  });

  return (
    <div data-part={PARTS.SOURCE_STEP}>
      <FileBadge
        file={step.file}
        meta={`L${step.lines[0]}–${step.lines[1]}`}
      />
      <CodeBlock>
        {isLoading && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-text-subtle)' }}>
              Loading…
            </span>
          </CodeLine>
        )}
        {isError && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-severity-issue)' }}>
              Error loading file: {String(error)}
            </span>
          </CodeLine>
        )}
        {!isLoading && !isError && data?.lines
          ? data.lines.map((line, i) => {
              const ln = step.lines[0] + i;
              const [hl0, hl1] = step.highlight ?? [];
              const isHighlight =
                step.highlight &&
                ln >= hl0 &&
                ln <= hl1;
              return (
                <CodeLine
                  key={i}
                  num={ln}
                  highlight={isHighlight}
                  highlightColor={accentColor}
                >
                  <span style={{ opacity: 0.25 }}>{line}</span>
                </CodeLine>
              );
            })
          : null}
      </CodeBlock>
      {step.note && <Note>{step.note}</Note>}
    </div>
  );
};
