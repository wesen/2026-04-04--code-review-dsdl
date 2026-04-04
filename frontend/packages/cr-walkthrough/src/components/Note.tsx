import React from 'react';
import { PARTS } from '../parts';

interface NoteProps {
  children: React.ReactNode;
}

export const Note: React.FC<NoteProps> = ({ children }) => (
  <p
    data-part={PARTS.NOTE}
    style={{
      margin: 'var(--cr-space-2) 0 0',
      fontSize: 'var(--cr-font-size-sm)',
      color: 'var(--cr-color-text-muted)',
      lineHeight: 'var(--cr-line-height-base)',
      fontStyle: 'italic',
    }}
  >
    <span data-part={PARTS.NOTE_TEXT}>{children}</span>
  </p>
);
