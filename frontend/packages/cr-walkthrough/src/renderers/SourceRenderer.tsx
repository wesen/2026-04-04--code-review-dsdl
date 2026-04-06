import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileContentQuery } from '../api/walkthroughsApi';
import type { SourceStep } from '../types';
import type { FileViewerState } from '../components/FileViewer';

/** Lines of context to show above and below the highlighted line in the FileViewer. */
const CONTEXT_LINES = 30;

interface Props {
  step: SourceStep;
  /** Override the default git ref (defaults to walkthrough head) */
  refOverride?: string;
  accentColor?: string;
  /** Walkthrough head ref — used to construct FileViewer URL */
  walkthroughRef?: string;
  /** Opens the FileViewer overlay. Undefined = links hidden. */
  onOpenFile?: (state: FileViewerState) => void;
}

export const SourceRenderer: React.FC<Props> = ({
  step,
  refOverride,
  accentColor,
  walkthroughRef,
  onOpenFile,
}) => {
  // Default to walkthrough head ref if step has no explicit ref override.
  const ref = refOverride || step.ref || walkthroughRef || 'HEAD';
  const hasLinks = onOpenFile !== undefined;

  const { data, isLoading, isError, error } = useGetFileContentQuery({
    ref,
    path: step.file,
    start: step.lines[0],
    end: step.lines[1],
  });

  // Open FileViewer at the full file range (no highlight).
  const handleFileBadgeClick = () => {
    onOpenFile?.({
      file: step.file,
      ref,
      startLine: step.lines[0],
      endLine: step.lines[1],
    });
  };

  // Open FileViewer showing the full file with surrounding context,
  // scrolling the clicked line to the centre of the viewport.
  const handleLineClick = (lineNum: number) => {
    const expandedStart = Math.max(1, lineNum - CONTEXT_LINES);
    const expandedEnd = lineNum + CONTEXT_LINES;
    onOpenFile?.({
      file: step.file,
      ref,
      startLine: expandedStart,
      endLine: expandedEnd,
      highlightLine: lineNum,
    });
  };

  return (
    <div data-part={PARTS.SOURCE_STEP}>
      <FileBadge
        file={step.file}
        meta={`L${step.lines[0]}–${step.lines[1]}`}
        ref_={ref}
        onClick={hasLinks ? handleFileBadgeClick : undefined}
        interactive={hasLinks}
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
                step.highlight !== undefined &&
                hl0 !== undefined &&
                hl1 !== undefined &&
                ln >= hl0 &&
                ln <= hl1;
              return (
                <CodeLine
                  key={i}
                  num={ln}
                  highlight={isHighlight}
                  highlightColor={accentColor}
                  onClick={hasLinks ? () => handleLineClick(ln) : undefined}
                  interactive={hasLinks}
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
