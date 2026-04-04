import React from 'react';
import { PARTS } from '../parts';

interface FileBadgeProps {
  file: string;
  meta?: string;
  /** data-part attribute value (default: FILE_BADGE) */
  part?: string;
}

export const FileBadge: React.FC<FileBadgeProps> = ({
  file,
  meta,
  part = PARTS.FILE_BADGE,
}) => (
  <div
    data-part={part}
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
    }}
  >
    <span
      data-part={PARTS.FILE_BADGE_PATH}
      style={{
        color: 'var(--cr-color-text)',
        fontWeight: 'var(--cr-font-weight-medium)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
      }}
    >
      {file}
    </span>
    {meta && (
      <span
        data-part={PARTS.FILE_BADGE_META}
        style={{
          color: 'var(--cr-color-text-subtle)',
          marginLeft: 'var(--cr-space-2)',
          flexShrink: 0,
          fontSize: 'var(--cr-font-size-xs)',
        }}
      >
        {meta}
      </span>
    )}
  </div>
);
