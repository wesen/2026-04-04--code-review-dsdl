import React from 'react';
import { PARTS } from '../parts';
import type { AnnotationSeverity } from '../types';
import type { FileViewerState } from '../components/FileViewer';

const SEVERITY_COLOR: Record<AnnotationSeverity, string> = {
  info: 'var(--cr-color-severity-info)',
  warn: 'var(--cr-color-severity-warn)',
  issue: 'var(--cr-color-severity-issue)',
  praise: 'var(--cr-color-severity-praise)',
};

const SEVERITY_PART: Record<AnnotationSeverity, string> = {
  info: PARTS.SEVERITY_INFO,
  warn: PARTS.SEVERITY_WARN,
  issue: PARTS.SEVERITY_ISSUE,
  praise: PARTS.SEVERITY_PRAISE,
};

interface Props {
  step: {
    file: string;
    line: number;
    severity: AnnotationSeverity;
    body: string;
    ref?: string;
  };
  /** Walkthrough head ref — used to construct FileViewer URL */
  walkthroughRef?: string;
  /** Opens the FileViewer overlay. Undefined = links hidden. */
  onOpenFile?: (state: FileViewerState) => void;
}

export const AnnotationRenderer: React.FC<Props> = ({
  step,
  walkthroughRef,
  onOpenFile,
}) => {
  const color = SEVERITY_COLOR[step.severity] ?? 'var(--cr-color-text-muted)';
  const part = SEVERITY_PART[step.severity] ?? PARTS.ANNOTATION_STEP;
  const hasLinks = onOpenFile !== undefined;

  // Resolve the git ref: explicit step ref overrides walkthrough head.
  const ref = step.ref || walkthroughRef || 'HEAD';

  const handleFileLineClick = () => {
    onOpenFile?.({
      file: step.file,
      ref,
      startLine: step.line,
      endLine: step.line,
      highlightLine: step.line,
    });
  };

  return (
    <div
      data-part={PARTS.ANNOTATION_STEP}
      data-severity={step.severity}
      style={{
        borderLeft: `3px solid ${color}`,
        paddingLeft: 'var(--cr-space-3)',
      }}
    >
      <div
        data-part={PARTS.ANNOTATION_HEADER}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cr-space-2)',
          marginBottom: 'var(--cr-space-1)',
        }}
      >
        <span
          data-part={part}
          style={{
            fontSize: 'var(--cr-font-size-xs)',
            fontWeight: 'var(--cr-font-weight-bold)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color,
          }}
        >
          {step.severity}
        </span>

        {/* File+line badge — interactive link to FileViewer */}
        <button
          onClick={hasLinks ? handleFileLineClick : undefined}
          disabled={!hasLinks}
          style={{
            fontFamily: 'var(--cr-font-mono)',
            fontSize: 'var(--cr-font-size-xs)',
            color: hasLinks ? 'var(--cr-color-accent)' : 'var(--cr-color-text-subtle)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: hasLinks ? 'pointer' : 'default',
            textDecoration: hasLinks ? 'underline' : 'none',
            textDecorationColor: 'var(--cr-color-accent)',
            textUnderlineOffset: '2px',
          }}
        >
          {step.file}:{step.line}
        </button>
      </div>

      <p
        data-part={PARTS.ANNOTATION_BODY}
        style={{
          margin: 0,
          lineHeight: 'var(--cr-line-height-base)',
          color: 'var(--cr-color-text)',
        }}
      >
        {step.body}
      </p>
    </div>
  );
};
