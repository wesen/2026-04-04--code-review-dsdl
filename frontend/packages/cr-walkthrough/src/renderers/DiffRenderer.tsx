import React from 'react';
import { PARTS } from '../parts';
import { FileBadge } from '../components/FileBadge';
import { CodeBlock } from '../components/CodeBlock';
import { CodeLine } from '../components/CodeLine';
import { Note } from '../components/Note';
import { useGetFileDiffQuery } from '../api/walkthroughsApi';
import type { DiffStep } from '../types';

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
    // Unified diff hunk header: @@ -a,b +c,d @@ optional header
    if (rawLine.startsWith('@@')) {
      lines.push({ kind: 'hunk', content: rawLine });
      const m = rawLine.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (m) {
        oldNum = parseInt(m[1], 10);
        newNum = parseInt(m[3], 10);
      }
      continue;
    }

    if (rawLine.startsWith('---') || rawLine.startsWith('+++')) {
      continue; // skip file headers
    }

    if (rawLine.startsWith('diff ') || rawLine.startsWith('index ')) {
      continue;
    }

    if (rawLine.startsWith('+')) {
      lines.push({ kind: 'addition', content: rawLine.slice(1), newNum: newNum++ });
    } else if (rawLine.startsWith('-')) {
      lines.push({ kind: 'deletion', content: rawLine.slice(1), oldNum: oldNum++ });
    } else if (rawLine.startsWith(' ')) {
      lines.push({
        kind: 'context',
        content: rawLine.slice(1),
        oldNum: oldNum++,
        newNum: newNum++,
      });
    } else if (rawLine !== '') {
      // Fallback: context with no leading space
      lines.push({ kind: 'context', content: rawLine });
    }
  }

  return lines;
}

// ── Renderer ─────────────────────────────────────────────────────────

interface Props {
  step: DiffStep;
  /** Override the base ref (default: walkthrough base) */
  baseOverride?: string;
  /** Override the head ref (default: walkthrough head) */
  headOverride?: string;
}

export const DiffRenderer: React.FC<Props> = ({
  step,
  baseOverride,
  headOverride,
}) => {
  const fromRef = baseOverride ?? step.ref ?? 'main';
  const toRef = headOverride ?? 'HEAD';

  const { data, isLoading, isError } = useGetFileDiffQuery(
    { from: fromRef, to: toRef, path: step.file },
    { skip: !fromRef && !toRef }
  );

  const diffLines = data?.diff ? parseDiff(data.diff) : [];

  return (
    <div data-part={PARTS.DIFF_STEP}>
      <FileBadge
        file={step.file}
        meta={step.hunks ? `hunks ${step.hunks.join(', ')}` : undefined}
      />
      <CodeBlock>
        {isLoading && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-text-subtle)' }}>
              Loading diff…
            </span>
          </CodeLine>
        )}
        {isError && (
          <CodeLine num={null}>
            <span style={{ color: 'var(--cr-color-severity-issue)' }}>
              Error loading diff
            </span>
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
