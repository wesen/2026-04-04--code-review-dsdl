import React from 'react';
import { PARTS } from '../parts';
import type { TextStep } from '../types';

interface Props {
  step: TextStep;
}

export const TextRenderer: React.FC<Props> = ({ step }) => (
  <p
    data-part={PARTS.TEXT_BODY}
    style={{
      margin: 0,
      lineHeight: 'var(--cr-line-height-base)',
      whiteSpace: 'pre-wrap',
      color: 'var(--cr-color-text)',
    }}
  >
    {step.body}
  </p>
);
