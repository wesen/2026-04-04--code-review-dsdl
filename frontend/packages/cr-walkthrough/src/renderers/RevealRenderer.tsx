import React, { useState } from 'react';
import { PARTS } from '../parts';
import type { RevealStep } from '../types';

interface Props {
  step: RevealStep;
}

export const RevealRenderer: React.FC<Props> = ({ step }) => {
  const [open, setOpen] = useState(false);

  return (
    <div data-part={PARTS.REVEAL_STEP}>
      <button
        data-part={PARTS.REVEAL_TOGGLE}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cr-space-2)',
          padding: 'var(--cr-space-1) var(--cr-space-3)',
          borderRadius: 'var(--cr-radius-md)',
          border: '1px solid var(--cr-color-border)',
          background: 'transparent',
          color: 'var(--cr-color-reveal-step)',
          fontSize: 'var(--cr-font-size-base)',
          fontWeight: 'var(--cr-font-weight-medium)',
          fontFamily: 'var(--cr-font-sans)',
          cursor: 'pointer',
        }}
      >
        <span
          data-part={PARTS.REVEAL_ARROW}
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform var(--cr-transition-base)',
            fontSize: 10,
          }}
        >
          ▸
        </span>
        {step.label}
      </button>

      {open && (
        <div
          data-part={PARTS.REVEAL_CONTENT}
          style={{
            marginTop: 'var(--cr-space-2)',
            padding: 'var(--cr-space-3)',
            background: 'var(--cr-color-surface-raised)',
            borderRadius: 'var(--cr-radius-lg)',
            lineHeight: 'var(--cr-line-height-relaxed)',
            fontSize: 'var(--cr-font-size-base)',
            whiteSpace: 'pre-wrap',
            color: 'var(--cr-color-text)',
          }}
        >
          {step.body}
        </div>
      )}
    </div>
  );
};
