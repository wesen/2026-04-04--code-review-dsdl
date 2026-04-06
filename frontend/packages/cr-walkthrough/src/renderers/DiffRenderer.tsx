import React from 'react';
import { PARTS } from '../parts';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileDiffQuery } from '../api/walkthroughsApi';
import type { DiffStep } from '../types';
import type { FileViewerState } from '../components/FileViewer';

// ── Unified diff parser ───────────────────────────────────────────────

type DiffLineKind = 'context' | 'addition' | 'deletion' | 'hunk';

interface ParsedLine {
  kind: DiffLineKind;
  content: string;
  oldNum?: number;
  newNum?: number;
}

function parseDiff(diff: string): ParsedLine[] {
  const lines: ParsedLine[] = [];
  const raw = diff.split('\n');
  let oldNum = 0;
  let newNum = 0;

  for (const rawLine of raw) {
    if (rawLine.startsWith('@@')) {
      lines.push({ kind: 'hunk', content: rawLine });
      const m = rawLine.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (m) {
        oldNum = parseInt(m[1], 10);
        newNum = parseInt(m[3], 10);
      }
      continue;
    }
    if (rawLine.startsWith('---') || rawLine.startsWith('+++')) continue;
    if (rawLine.startsWith('diff ') || rawLine.startsWith('index ')) continue;
    if (rawLine.startsWith('+')) {
      lines.push({ kind: 'addition', content: rawLine.slice(1), newNum: newNum++ });
    } else if (rawLine.startsWith('-')) {
      lines.push({ kind: 'deletion', content: rawLine.slice(1), oldNum: oldNum++ });
    } else if (rawLine.startsWith(' ')) {
      lines.push({ kind: 'context', content: rawLine.slice(1), oldNum: oldNum++, newNum: newNum++ });
    } else if (rawLine !== '') {
      lines.push({ kind: 'context', content: rawLine });
    }
  }

  return lines;
}

// ── Ref badge ───────────────────────────────────────────────────────

function RefBadge({
  label,
  ref,
  isFrom,
  interactive,
  onClick,
}: {
  label: string;
  ref: string;
  isFrom: boolean;
  interactive: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={!interactive}
      onClick={onClick}
      style={{
        fontFamily: 'var(--cr-font-mono)',
        fontSize: 'var(--cr-font-size-xs)',
        fontWeight: 'var(--cr-font-weight-semibold)',
        padding: '2px 8px',
        borderRadius: 'var(--cr-radius-sm)',
        border: `1px solid ${isFrom ? 'var(--cr-color-diff-del-text)' : 'var(--cr-color-diff-add-text)'}`,
        background: isFrom
          ? 'color-mix(in srgb, var(--cr-color-diff-del-bg) 60%, transparent)'
          : 'color-mix(in srgb, var(--cr-color-diff-add-bg) 60%, transparent)',
        color: isFrom
          ? 'var(--cr-color-diff-del-text)'
          : 'var(--cr-color-diff-add-text)',
        cursor: interactive ? 'pointer' : 'default',
        letterSpacing: '0.03em',
        transition: interactive ? 'opacity 0.15s' : 'none',
      }}
    >
      {ref}
    </button>
  );
}

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  step: DiffStep;
  /** Override the base ref (default: walkthrough base) */
  baseOverride?: string;
  /** Override the head ref (default: walkthrough head) */
  headOverride?: string;
  /** Walkthrough head ref — used to construct FileViewer URL */
  walkthroughRef?: string;
  /** Opens the FileViewer overlay. Undefined = links hidden. */
  onOpenFile?: (state: FileViewerState) => void;
}

export const DiffRenderer: React.FC<Props> = ({
  step,
  baseOverride,
  headOverride,
  walkthroughRef,
  onOpenFile,
}) => {
  const fromRef = baseOverride ?? step.ref ?? 'main';
  const toRef = headOverride ?? walkthroughRef ?? 'HEAD';
  const hasLinks = onOpenFile !== undefined;

  const { data, isLoading, isError } = useGetFileDiffQuery(
    { from: fromRef, to: toRef, path: step.file },
    { skip: !fromRef && !toRef }
  );

  const diffLines = data?.diff ? parseDiff(data.diff) : [];

  const handleFromClick = () => {
    onOpenFile?.({
      file: step.file,
      ref: fromRef,
      startLine: 1,
      endLine: 1,
      compare: true,
      compareRef: toRef,
    });
  };

  const handleToClick = () => {
    onOpenFile?.({
      file: step.file,
      ref: toRef,
      startLine: 1,
      endLine: 1,
      compare: true,
      compareRef: fromRef,
    });
  };

  return (
    <div data-part={PARTS.DIFF_STEP}>
      {/* Diff header: from → to badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cr-space-2)',
          padding: 'var(--cr-space-1) var(--cr-space-3)',
          background: 'var(--cr-color-surface-raised)',
          borderBottom: '1px solid var(--cr-color-border)',
          borderRadius: 'var(--cr-radius-lg) var(--cr-radius-lg) 0 0',
          fontFamily: 'var(--cr-font-mono)',
          fontSize: 'var(--cr-font-size-sm)',
          minWidth: 0,
        }}
      >
        <RefBadge label="from" ref={fromRef} isFrom interactive={hasLinks} onClick={handleFromClick} />
        <span style={{ color: 'var(--cr-color-text-subtle)', userSelect: 'none' }}>→</span>
        <RefBadge label="to" ref={toRef} isFrom={false} interactive={hasLinks} onClick={handleToClick} />
        {step.file && (
          <span
            style={{
              marginLeft: 'var(--cr-space-2)',
              color: 'var(--cr-color-text-subtle)',
              fontSize: 'var(--cr-font-size-xs)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {step.file}
          </span>
        )}
      </div>

      <CodeBlock>
        {isLoading && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-text-subtle)' }}>Loading diff…</span>
          </CodeLine>
        )}
        {isError && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-severity-issue)' }}>Error loading diff</span>
          </CodeLine>
        )}
        {!isLoading &&
          !isError &&
          diffLines.map((line, i) => {
            if (line.kind === 'hunk') {
              return (
                <CodeLine key={i} num={null}>
                  <span
                    style={{
                      color: 'var(--cr-color-diff-step)',
                      fontWeight: 'var(--cr-font-weight-semibold)',
                    }}
                  >
                    {line.content}
                  </span>
                </CodeLine>
              );
            }

            const isAddition = line.kind === 'addition';
            const isDeletion = line.kind === 'deletion';

            return (
              <CodeLine
                key={i}
                num={isAddition ? line.newNum : isDeletion ? line.oldNum : line.newNum}
                highlight={isAddition || isDeletion}
                highlightColor={
                  isAddition
                    ? 'var(--cr-color-diff-add-text)'
                    : 'var(--cr-color-diff-del-text)'
                }
              >
                <span
                  style={{
                    color: isAddition
                      ? 'var(--cr-color-diff-add-text)'
                      : isDeletion
                        ? 'var(--cr-color-diff-del-text)'
                        : 'var(--cr-color-text)',
                  }}
                >
                  {isAddition ? '+ ' : isDeletion ? '- ' : '  '}
                  {line.content}
                </span>
              </CodeLine>
            );
          })}
        {data?.diff === '' && !isLoading && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-text-subtle)' }}>
              No differences between {fromRef} and {toRef}
            </span>
          </CodeLine>
        )}
      </CodeBlock>
      {step.note && <Note>{step.note}</Note>}
    </div>
  );
};
