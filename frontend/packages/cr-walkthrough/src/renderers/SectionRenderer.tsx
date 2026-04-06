import React from 'react';
import { PARTS } from '../parts';
import { StepCard } from './StepCard';
import type { SectionStep } from '../types';
import type { FileViewerState } from '../components/FileViewer';

interface Props {
  step: SectionStep;
  /** 0-indexed depth (first section = 0) */
  depth?: number;
  /** Called when a branch option is selected */
  onGoto?: (goto: string) => void;
  /** Current step index offset (for numbering) */
  indexOffset?: number;
  /** Walkthrough head ref — used to construct file URLs */
  walkthroughRef?: string;
  /** Opens the FileViewer overlay */
  onOpenFile?: (state: FileViewerState) => void;
}

export const SectionRenderer: React.FC<Props> = ({
  step,
  depth = 0,
  onGoto,
  indexOffset = 0,
  walkthroughRef,
  onOpenFile,
}) => {
  return (
    <div
      data-part={PARTS.SECTION_STEP}
      style={{
        borderLeft:
          depth > 0
            ? '2px solid rgba(168,126,224,0.25)'
            : 'none',
        paddingLeft: depth > 0 ? 'var(--cr-space-4)' : 0,
      }}
    >
      <div
        data-part={PARTS.SECTION_TITLE}
        style={{
          fontSize: 'var(--cr-font-size-lg)',
          fontWeight: 'var(--cr-font-weight-bold)',
          color: 'var(--cr-color-section-step)',
          marginBottom: 'var(--cr-space-3)',
          letterSpacing: '-0.01em',
        }}
      >
        {step.title}
      </div>
      <div data-part={PARTS.SECTION_STEPS}>
        {step.steps.map((s, i) => (
          <StepCard
            key={i}
            step={s}
            index={`${indexOffset + i + 1}`}
            depth={depth + 1}
            onGoto={onGoto}
            walkthroughRef={walkthroughRef}
            onOpenFile={onOpenFile}
          />
        ))}
      </div>
    </div>
  );
};
