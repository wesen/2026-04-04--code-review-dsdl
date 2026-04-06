import React from 'react';
import { PARTS } from '../parts';

interface CodeLineProps {
  num?: number | null;
  children: React.ReactNode;
  /** Highlight this line */
  highlight?: boolean;
  highlightColor?: string;
  /** Click handler — makes the line interactive */
  onClick?: () => void;
  /** When true, the line is styled as a clickable target */
  interactive?: boolean;
  /** Extra style overrides */
  style?: React.CSSProperties;
}

export const CodeLine: React.FC<CodeLineProps> = ({
  num,
  children,
  highlight = false,
  highlightColor,
  onClick,
  interactive = false,
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

  const cursor = interactive && onClick ? 'pointer' : 'default';

  return (
    <div
      data-part={highlight ? PARTS.CODE_LINE_HIGHLIGHT : PARTS.CODE_LINE}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      style={{
        padding: '1px var(--cr-space-3)',
        background: bg,
        borderLeft: `2px solid ${borderColor}`,
        whiteSpace: 'pre',
        cursor,
        transition: interactive ? 'background 0.1s' : 'none',
        ...style,
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              if (!highlight)
                (e.currentTarget as HTMLDivElement).style.background =
                  'color-mix(in srgb, var(--cr-color-accent) 6%, transparent)';
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              if (!highlight)
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }
          : undefined
      }
    >
      {num != null && (
        <span
          data-part={PARTS.CODE_LINE_NUMBER}
          style={{
            display: 'inline-block',
            width: '2.5em',
            color: interactive
              ? 'var(--cr-color-accent)'
              : 'var(--cr-color-text-subtle)',
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
