import React from 'react';
import { PARTS } from '../parts';
import type { LinkStep } from '../types';

interface Props {
  step: LinkStep;
}

export const LinkRenderer: React.FC<Props> = ({ step }) => (
  <a
    data-part={PARTS.LINK_STEP}
    href={step.url}
    target="_blank"
    rel="noopener noreferrer"
    data-part-anchor={PARTS.LINK_ANCHOR}
    style={{
      color: 'var(--cr-color-link-step)',
      textDecoration: 'none',
      borderBottom: '1px dashed currentColor',
      fontSize: 'var(--cr-font-size-base)',
    }}
  >
    {step.label || step.url}
    {' ↗'}
  </a>
);
