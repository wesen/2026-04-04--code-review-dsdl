import React from 'react';
import { PARTS } from '../parts';
import type { BranchStep } from '../types';

interface Props {
  step: BranchStep;
  onSelect?: (goto: string) => void;
}

export const BranchRenderer: React.FC<Props> = ({ step, onSelect }) => (
  <div data-part={PARTS.BRANCH_STEP}>
    {step.prompt && (
      <p
        data-part={PARTS.BRANCH_PROMPT}
        style={{
          margin: '0 0 var(--cr-space-3)',
          fontWeight: 'var(--cr-font-weight-semibold)',
          color: 'var(--cr-color-text)',
        }}
      >
        {step.prompt}
      </p>
    )}
    <div
      data-part={PARTS.BRANCH_OPTIONS}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-space-2)' }}
    >
      {step.options.map((opt, i) => (
        <button
          key={i}
          data-part={PARTS.BRANCH_OPTION}
          onClick={() => onSelect?.(opt.goto)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--cr-space-2) var(--cr-space-3)',
            borderRadius: 'var(--cr-radius-md)',
            border: '1px solid var(--cr-color-border)',
            background: 'var(--cr-color-surface-raised)',
            color: 'var(--cr-color-text)',
            fontSize: 'var(--cr-font-size-base)',
            fontFamily: 'var(--cr-font-sans)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color var(--cr-transition-fast)',
          }}
        >
          <span>{opt.label}</span>
          <span
            data-part={PARTS.BRANCH_OPTION_GOTO}
            style={{
              fontFamily: 'var(--cr-font-mono)',
              fontSize: 'var(--cr-font-size-xs)',
              color: 'var(--cr-color-branch-step)',
            }}
          >
            #{opt.goto}
          </span>
        </button>
      ))}
    </div>
  </div>
);
