import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileContentQuery } from '../api/walkthroughsApi';
import type { CompareStep } from '../types';
import type { FileViewerState } from '../components/FileViewer';

interface SidePaneProps {
  label: string;
  file: string;
  ref: string;
  lines: [number, number];
  accentColor: string;
  /** Opens the FileViewer overlay */
  onOpenFile?: (state: FileViewerState) => void;
}

const SidePane: React.FC<SidePaneProps> = ({
  label,
  file,
  ref,
  lines,
  accentColor,
  onOpenFile,
}) => {
  const hasLinks = onOpenFile !== undefined;

  const { data, isLoading } = useGetFileContentQuery(
    { ref, path: file, start: lines[0], end: lines[1] },
    { skip: !ref }
  );

  const handleClick = () => {
    onOpenFile?.({
      file,
      ref,
      startLine: lines[0],
      endLine: lines[1],
    });
  };

  return (
    <div data-part={PARTS.SIDE_PANE} style={{ flex: 1, minWidth: 0 }}>
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
        meta={`L${lines[0]}–${lines[1]}`}
        ref_={ref}
        interactive={hasLinks}
        onClick={hasLinks ? handleClick : undefined}
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
  /** Walkthrough head ref — used to construct FileViewer URL */
  walkthroughRef?: string;
  /** Opens the FileViewer overlay. Undefined = links hidden. */
  onOpenFile?: (state: FileViewerState) => void;
}

export const CompareRenderer: React.FC<Props> = ({ step, walkthroughRef, onOpenFile }) => (
  <div data-part={PARTS.COMPARE_STEP}>
    <div data-part={PARTS.SIDE_BY_SIDE} style={{ display: 'flex', gap: 'var(--cr-space-3)' }}>
      <SidePane
        label="before"
        file={step.left.file}
        ref={step.left.ref || 'main'}
        lines={step.left.lines}
        accentColor="var(--cr-color-diff-del-text)"
        onOpenFile={onOpenFile}
      />
      <SidePane
        label="after"
        file={step.right.file}
        ref={step.right.ref || walkthroughRef || 'HEAD'}
        lines={step.right.lines}
        accentColor="var(--cr-color-diff-add-text)"
        onOpenFile={onOpenFile}
      />
    </div>
    {step.note && <Note>{step.note}</Note>}
  </div>
);
