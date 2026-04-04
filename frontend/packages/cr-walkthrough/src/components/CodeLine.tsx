import React from 'react';
import { PARTS } from '../parts';

interface CodeLineProps {
  num?: number | null;
  children: React.ReactNode;
  /** Highlight this line */
  highlight?: boolean;
  highlightColor?: string;
  /** Extra style overrides */
  style?: React.CSSProperties;
}

export const CodeLine: React.FC<CodeLineProps> = ({
  num,
  children,
  highlight = false,
  highlightColor,
  style,
}) => {
  const bg = highlight
    ? highlightColor
      ? `${highlightColor}18`
      : 'var(--cr-color-diff-hl-bg)'
    : 'transparent';
  const borderColor = highlight
    ? highlightColor
      ? `${highlightColor}`
      : 'var(--cr-color-diff-step)'
    : 'transparent';

  return (
    <div
      data-part={highlight ? PARTS.CODE_LINE_HIGHLIGHT : PARTS.CODE_LINE}
      style={{
        padding: '1px var(--cr-space-3)',
        background: bg,
        borderLeft: `2px solid ${borderColor}`,
        whiteSpace: 'pre',
        ...style,
      }}
    >
      {num != null && (
        <span
          data-part={PARTS.CODE_LINE_NUMBER}
          style={{
            display: 'inline-block',
            width: '2.5em',
            color: 'var(--cr-color-text-subtle)',
            textAlign: 'right',
            marginRight: 'var(--cr-space-3)',
            userSelect: 'none',
            fontSize: 'var(--cr-font-size-xs)',
          }}
        >
          {num}
        </span>
      )}
      <span style={{ color: 'var(--cr-color-text)' }}>{children}</span>
    </div>
  );
};
