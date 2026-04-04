import React, { useState } from 'react';
import { PARTS } from '../parts';
import type { CheckpointStep as CheckpointStepType } from '../types';

interface Props {
  step: CheckpointStepType;
}

export const CheckpointRenderer: React.FC<Props> = ({ step }) => {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div data-part={PARTS.CHECKPOINT_STEP}>
      <p
        data-part={PARTS.CHECKPOINT_PROMPT}
        style={{
          margin: '0 0 var(--cr-space-3)',
          fontWeight: 'var(--cr-font-weight-semibold)',
          color: 'var(--cr-color-text)',
        }}
      >
        {step.prompt}
      </p>

      <div
        data-part={PARTS.CHECKPOINT_CHOICES}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-space-2)' }}
      >
        {step.choices.map((choice, i) => {
          const isPicked = picked === i;
          const isCorrect = choice.correct;
          const borderColor = isPicked
            ? isCorrect
              ? 'var(--cr-color-severity-praise)'
              : 'var(--cr-color-severity-issue)'
            : 'var(--cr-color-border)';
          const bg = isPicked
            ? isCorrect
              ? 'var(--cr-color-diff-add-bg)'
              : 'var(--cr-color-diff-del-bg)'
            : 'transparent';

          return (
            <button
              key={i}
              data-part={PARTS.CHECKPOINT_CHOICE}
              onClick={() => setPicked(i)}
              disabled={picked !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--cr-space-2)',
                padding: 'var(--cr-space-2) var(--cr-space-3)',
                borderRadius: 'var(--cr-radius-md)',
                border: `1px solid ${borderColor}`,
                background: bg,
                color: 'var(--cr-color-text)',
                fontSize: 'var(--cr-font-size-base)',
                fontFamily: 'var(--cr-font-sans)',
                textAlign: 'left',
                cursor: picked !== null ? 'default' : 'pointer',
                transition: 'all var(--cr-transition-base)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${borderColor}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  flexShrink: 0,
                  color: isPicked
                    ? isCorrect
                      ? 'var(--cr-color-severity-praise)'
                      : 'var(--cr-color-severity-issue)'
                    : 'var(--cr-color-text-subtle)',
                }}
              >
                {isPicked ? (isCorrect ? '✓' : '✗') : ''}
              </span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {picked !== null && step.choices[picked] && (
        <div
          data-part={PARTS.CHECKPOINT_FEEDBACK}
          data-correct={step.choices[picked].correct}
          style={{
            marginTop: 'var(--cr-space-2)',
            padding: 'var(--cr-space-2) var(--cr-space-3)',
            borderRadius: 'var(--cr-radius-md)',
            fontSize: 'var(--cr-font-size-sm)',
            lineHeight: 'var(--cr-line-height-base)',
            background: step.choices[picked].correct
              ? 'var(--cr-color-diff-add-bg)'
              : 'var(--cr-color-diff-del-bg)',
            color: step.choices[picked].correct
              ? 'var(--cr-color-severity-praise)'
              : 'var(--cr-color-severity-issue)',
          }}
        >
          {step.choices[picked].explain}
        </div>
      )}
    </div>
  );
};
