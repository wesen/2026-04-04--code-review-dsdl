import React from 'react';
import { STEP_TYPE_META } from './StepRendererRegistry';
import { PARTS } from '../parts';
import { StepRendererRegistry } from './StepRendererRegistry';
import type { Step } from '../types';

interface Props {
  step: Step;
  index: string;
  depth?: number;
  onGoto?: (goto: string) => void;
}

// Stable step anchor ID: explicit id field if present, otherwise "step-{index}".
// "{index}" is the walkthrough-relative 1-based step number (passed from CRWalkthrough).
function stepAnchorId(id: string | undefined, index: string): string {
  return id ?? `step-${index}`;
}

export const StepCard: React.FC<Props> = ({ step, index, depth = 0, onGoto }) => {
  const meta = STEP_TYPE_META[step.type] ?? { icon: '?', colorVar: '--cr-color-text-step' };
  const anchorId = stepAnchorId(step.id, index);

  return (
    <div
      data-part={PARTS.STEP_CARD}
      data-step-type={step.type}
      data-step-id={anchorId}
      id={anchorId}
      style={{
        border: '1px solid var(--cr-color-border)',
        borderRadius: 'var(--cr-radius-lg)',
        padding: 'var(--cr-space-3) var(--cr-space-4)',
        background: 'var(--cr-color-surface)',
        marginBottom: 'var(--cr-space-1)',
        boxShadow: 'var(--cr-shadow-card)',
      }}
    >
      {/* Step header: type badge + index */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--cr-space-3)',
        }}
      >
        <span
          data-part={PARTS.STEP_TYPE_BADGE}
          style={{
            fontFamily: 'var(--cr-font-mono)',
            fontSize: 'var(--cr-font-size-sm)',
            fontWeight: 'var(--cr-font-weight-semibold)',
            padding: '2px 8px',
            borderRadius: 'var(--cr-radius-sm)',
            background: `color-mix(in srgb, var(${meta.colorVar}) 12%, transparent)`,
            color: `var(${meta.colorVar})`,
            letterSpacing: '0.04em',
          }}
        >
          {meta.icon} {step.type}
        </span>
        <span
          data-part={PARTS.STEP_INDEX}
          style={{
            fontSize: 'var(--cr-font-size-xs)',
            color: 'var(--cr-color-text-subtle)',
            fontFamily: 'var(--cr-font-mono)',
          }}
        >
          #{index}
        </span>
      </div>

      {/* Step content */}
      <StepRendererRegistry step={step} depth={depth} onGoto={onGoto} />
    </div>
  );
};
