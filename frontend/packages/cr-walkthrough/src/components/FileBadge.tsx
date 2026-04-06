import React from 'react';
import { PARTS } from '../parts';

interface FileBadgeProps {
  file: string;
  meta?: string;
  /** Optional git ref to show alongside the file */
  ref_?: string;
  /** Click handler — makes the badge interactive */
  onClick?: () => void;
  /** When true, the badge is styled as a clickable link */
  interactive?: boolean;
  /** data-part attribute value (default: FILE_BADGE) */
  part?: string;
}

export const FileBadge: React.FC<FileBadgeProps> = ({
  file,
  meta,
  ref_,
  onClick,
  interactive = false,
  part = PARTS.FILE_BADGE,
}) => {
  const cursor = interactive && onClick ? 'pointer' : 'default';

  return (
    <div
      data-part={part}
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--cr-space-1) var(--cr-space-3)',
        background: 'var(--cr-color-surface-raised)',
        borderBottom: '1px solid var(--cr-color-border)',
        borderRadius: 'var(--cr-radius-lg) var(--cr-radius-lg) 0 0',
        fontFamily: 'var(--cr-font-mono)',
        fontSize: 'var(--cr-font-size-sm)',
        minWidth: 0,
        cursor,
        userSelect: 'none',
        transition: interactive ? 'background 0.15s' : 'none',
      }}
      onMouseEnter={
        interactive
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                'color-mix(in srgb, var(--cr-color-accent) 10%, var(--cr-color-surface-raised))';
            }
          : undefined
      }
      onMouseLeave={
        interactive
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                'var(--cr-color-surface-raised)';
            }
          : undefined
      }
    >
      <span
        data-part={PARTS.FILE_BADGE_PATH}
        style={{
          color: interactive ? 'var(--cr-color-accent)' : 'var(--cr-color-text)',
          fontWeight: 'var(--cr-font-weight-medium)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
          textDecoration: interactive ? 'underline' : 'none',
          textDecorationColor: 'var(--cr-color-accent)',
          textUnderlineOffset: '2px',
        }}
      >
        {file}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cr-space-2)',
          flexShrink: 0,
          marginLeft: 'var(--cr-space-2)',
        }}
      >
        {ref_ && (
          <span
            style={{
              color: 'var(--cr-color-text-subtle)',
              fontSize: 'var(--cr-font-size-xs)',
            }}
          >
            ({ref_})
          </span>
        )}
        {meta && (
          <span
            data-part={PARTS.FILE_BADGE_META}
            style={{
              color: 'var(--cr-color-text-subtle)',
              fontSize: 'var(--cr-font-size-xs)',
            }}
          >
            {meta}
          </span>
        )}
      </span>
    </div>
  );
};
