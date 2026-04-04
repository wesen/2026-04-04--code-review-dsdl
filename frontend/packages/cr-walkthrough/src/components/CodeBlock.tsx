import React from 'react';
import { PARTS } from '../parts';

interface CodeBlockProps {
  children: React.ReactNode;
  /** Add border-radius bottom (default true) */
  rounded?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  rounded = true,
  className,
}) => (
  <div
    data-part={PARTS.CODE_BLOCK}
    className={className}
    style={{
      fontFamily: 'var(--cr-font-mono)',
      fontSize: 'var(--cr-font-size-code)',
      lineHeight: 'var(--cr-line-height-base)',
      padding: 'var(--cr-space-2) 0',
      background: 'var(--cr-color-surface)',
      borderRadius: rounded ? '0 0 var(--cr-radius-lg) var(--cr-radius-lg)' : '0',
      overflowX: 'auto',
    }}
  >
    {children}
  </div>
);
