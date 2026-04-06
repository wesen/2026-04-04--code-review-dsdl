import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PARTS } from '../parts';
import { useGetFileContentQuery } from '../api/walkthroughsApi';
import { CodeBlock } from './CodeBlock';
import { CodeLine } from './CodeLine';
import type { FileContent } from '../types';

// ── State shape ─────────────────────────────────────────────────────

export interface FileViewerState {
  file: string;
  ref: string;
  startLine: number;
  endLine: number;
  highlightLine?: number;
  compare: boolean;
  compareRef?: string;
}

// ── URL helpers ──────────────────────────────────────────────────────

/** Serialize FileViewerState into query params on top of base URL. */
export function buildFileViewerUrl(
  base: string,
  state: Partial<FileViewerState>
): string {
  const params = new URLSearchParams();
  if (state.file) params.set('file', state.file);
  if (state.ref) params.set('ref', state.ref);
  if (state.startLine !== undefined && state.endLine !== undefined)
    params.set('lines', `${state.startLine},${state.endLine}`);
  if (state.highlightLine !== undefined)
    params.set('highlight', String(state.highlightLine));
  if (state.compare) params.set('compare', 'true');
  if (state.compareRef) params.set('compareRef', state.compareRef);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ── Query param parsing ─────────────────────────────────────────────

function parseState(params: URLSearchParams): Partial<FileViewerState> | null {
  const file = params.get('file');
  const ref = params.get('ref');
  const linesStr = params.get('lines');
  const lines = linesStr
    ? (() => {
        const [s, e] = linesStr.split(',').map(Number);
        return { startLine: s, endLine: e } as { startLine: number; endLine: number };
      })()
    : undefined;
  const highlightStr = params.get('highlight');
  const highlightLine = highlightStr ? Number(highlightStr) : undefined;
  const compare = params.get('compare') === 'true';
  const compareRef = params.get('compareRef') ?? undefined;

  if (!file || !ref || !lines) return null;

  return {
    file,
    ref,
    startLine: lines.startLine,
    endLine: lines.endLine,
    highlightLine: highlightLine ?? undefined,
    compare,
    compareRef: compareRef ?? undefined,
  };
}

// ── Props ────────────────────────────────────────────────────────────

export interface FileViewerProps {
  /** Base URL path, e.g. "/wt/auth-refactor" */
  baseUrl: string;
  /** Walkthrough head ref — used when an annotation references walkthrough.head */
  headRef?: string;
  /**
   * Display mode: 'modal' (default, overlay) or 'inline' (in-flow).
   * In inline mode, the viewer renders where it is placed in the DOM.
   */
  defaultMode?: 'modal' | 'inline';
}

// ── Sub-components ───────────────────────────────────────────────────

function FilePane({
  content,
  highlightLine,
  paneRef,
}: {
  content: FileContent;
  highlightLine?: number;
  paneRef?: string;
}) {
  const highlightRef = useRef<HTMLDivElement>(null);

  // Scroll highlighted line into view whenever highlight changes.
  useEffect(() => {
    if (highlightLine != null && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [highlightLine]);

  return (
    <div data-part={PARTS.FILE_VIEWER_PANE} style={{ flex: 1, overflowX: 'auto' }}>
      {paneRef && (
        <div
          data-part={PARTS.FILE_VIEWER_PANE_LABEL}
          style={{
            padding: 'var(--cr-space-2) var(--cr-space-3)',
            fontSize: 'var(--cr-font-size-xs)',
            fontFamily: 'var(--cr-font-mono)',
            color: 'var(--cr-color-text-subtle)',
            borderBottom: '1px solid var(--cr-color-border)',
          }}
        >
          {paneRef}
        </div>
      )}
      <CodeBlock>
        {content.lines.map((line, i) => {
          const lineNum = content.start + i;
          const isHighlighted = highlightLine === lineNum;
          return (
            <div key={i} ref={isHighlighted ? highlightRef : undefined}>
              <CodeLine
                num={lineNum}
                highlight={isHighlighted}
              >
                {line}
              </CodeLine>
            </div>
          );
        })}
      </CodeBlock>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

/**
 * FileViewer reads `file`, `ref`, `lines`, `highlight`, `compare`, and `compareRef`
 * query params from the current URL and renders the requested file content.
 *
 * It does **not** render anything if no file query params are present.
 * Call `buildFileViewerUrl(base, state)` and `navigate(url)` to open it.
 *
 * The FileViewer is always rendered inside a route that has access to
 * `useSearchParams` (i.e., inside `<BrowserRouter>`).
 *
 * Compare mode fetches two refs in parallel and renders them side by side.
 */
export const FileViewer: React.FC<FileViewerProps> = ({ baseUrl, headRef, defaultMode = 'modal' }) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'modal' | 'inline'>(defaultMode);

  const state = parseState(params);
  if (!state) return null;

  const isInline = mode === 'inline';

  const switchToModal = () => {
    setMode('modal');
    // Add modal query param so the URL always reflects modal mode.
    // For inline mode the viewer is just rendered in-flow with no extra param.
    const newParams = new URLSearchParams(params);
    newParams.set('_mode', 'modal');
    navigate(`${baseUrl}?${newParams.toString()}`, { replace: true });
  };

  const switchToInline = () => {
    setMode('inline');
    // Remove the _mode param to keep URL clean.
    const newParams = new URLSearchParams(params);
    newParams.delete('_mode');
    navigate(`${baseUrl}?${newParams.toString()}`, { replace: true });
  };

  // The primary ref to display (or the "to" ref in compare mode).
  const primaryRef = state.ref;

  // For compare mode: the second ref is compareRef if provided,
  // otherwise fall back to the "from" meaning (compareRef stores from when opened
  // from DiffRenderer).
  const secondaryRef = state.compareRef;

  const { data: primaryContent, isLoading: primaryLoading } = useGetFileContentQuery({
    ref: primaryRef,
    path: state.file,
    start: state.startLine,
    end: state.endLine,
  });

  // Always call the hook (Rules of Hooks). Use skip=true when compare mode is not active
  // or secondaryRef is unavailable so no network request fires.
  const { data: secondaryContent, isLoading: secondaryLoading } = useGetFileContentQuery(
    {
      ref: secondaryRef ?? '',
      path: state.file,
      start: state.startLine,
      end: state.endLine,
    },
    { skip: !state.compare || !secondaryRef }
  );

  // secondaryLoading is always defined (hook is always called); it is false when skip=true.
  const isLoading = primaryLoading || secondaryLoading;

  // Highlight applies to the primary pane (or to whichever pane is shown).
  // In compare mode the "after" pane (primaryRef) is highlighted.
  const highlightLine = state.highlightLine;

  const handleClose = () => navigate(baseUrl);

  const lineRangeLabel =
    state.startLine === state.endLine
      ? `L${state.startLine}`
      : `L${state.startLine}–${state.endLine}`;

  const commonPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--cr-color-surface)',
    border: '1px solid var(--cr-color-border)',
    borderRadius: 'var(--cr-radius-xl)',
    overflow: 'hidden',
    ...(isInline
      ? {
          boxShadow: 'var(--cr-shadow-card)',
          marginBottom: 'var(--cr-space-4)',
        }
      : {
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }),
  };

  const headerButtonStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 'var(--cr-radius-sm)',
    border: '1px solid var(--cr-color-border)',
    background: 'var(--cr-color-surface)',
    color: 'var(--cr-color-text-muted)',
    fontSize: 'var(--cr-font-size-xs)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  };

  // ── Inline mode ────────────────────────────────────────────────
  if (isInline) {
    return (
      <div data-part={PARTS.FILE_VIEWER} data-mode="inline">
        <div style={{ ...commonPanelStyle }}>
          <div
            data-part={PARTS.FILE_VIEWER_HEADER}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--cr-space-2) var(--cr-space-3)',
              borderBottom: '1px solid var(--cr-color-border)',
              background: 'var(--cr-color-surface-raised)',
              gap: 'var(--cr-space-3)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                data-part={PARTS.FILE_BADGE_PATH}
                style={{
                  fontFamily: 'var(--cr-font-mono)',
                  fontSize: 'var(--cr-font-size-sm)',
                  color: 'var(--cr-color-text)',
                  fontWeight: 500,
                }}
              >
                {state.file}
              </span>
              <span
                data-part={PARTS.FILE_BADGE_META}
                style={{
                  fontFamily: 'var(--cr-font-mono)',
                  fontSize: 'var(--cr-font-size-xs)',
                  color: 'var(--cr-color-text-subtle)',
                }}
              >
                {primaryRef} · {lineRangeLabel}
                {state.compare && secondaryRef && ` · vs ${secondaryRef}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--cr-space-2)' }}>
              <button
                style={headerButtonStyle}
                onClick={switchToModal}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-accent)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-inverse)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-surface)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-text-muted)';
                }}
              >
                Open as modal
              </button>
              <button
                data-part={PARTS.FILE_VIEWER_CLOSE}
                style={headerButtonStyle}
                onClick={handleClose}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-accent)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-inverse)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-surface)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-text-muted)';
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {isLoading ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--cr-color-text-muted)', fontSize: 13 }}>Loading…</div>
            ) : primaryContent ? (
              state.compare && secondaryContent ? (
                <div style={{ display: 'flex', overflow: 'hidden' }}>
                  <FilePane content={secondaryContent} highlightLine={highlightLine} paneRef={secondaryRef} />
                  <div style={{ width: 1, background: 'var(--cr-color-border)', flexShrink: 0 }} />
                  <FilePane content={primaryContent} highlightLine={highlightLine} paneRef={primaryRef} />
                </div>
              ) : (
                <FilePane content={primaryContent} highlightLine={highlightLine} />
              )
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--cr-color-text-muted)', fontFamily: 'var(--cr-font-mono)', fontSize: 13 }}>
                Could not load file. <span style={{ color: 'var(--cr-color-text-subtle)' }}>{state.file}@{state.ref}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Modal mode ───────────────────────────────────────────────
  return (
    <div
      data-part={PARTS.FILE_VIEWER}
      data-mode="modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}
    >
      {/* Backdrop — clicking it closes the viewer */}
      <div
        data-part={PARTS.FILE_VIEWER_OVERLAY}
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          pointerEvents: 'all',
          cursor: 'pointer',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 'var(--cr-space-8) auto',
          width: 'min(900px, 90vw)',
          maxHeight: '80vh',
          ...commonPanelStyle,
          pointerEvents: 'all',
        }}
      >
        {/* Header */}
        <div
          data-part={PARTS.FILE_VIEWER_HEADER}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--cr-space-3) var(--cr-space-4)',
            borderBottom: '1px solid var(--cr-color-border)',
            background: 'var(--cr-color-surface-raised)',
            gap: 'var(--cr-space-4)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              data-part={PARTS.FILE_BADGE_PATH}
              style={{
                fontFamily: 'var(--cr-font-mono)',
                fontSize: 'var(--cr-font-size-sm)',
                color: 'var(--cr-color-text)',
                fontWeight: 500,
              }}
            >
              {state.file}
            </span>
            <span
              data-part={PARTS.FILE_BADGE_META}
              style={{
                fontFamily: 'var(--cr-font-mono)',
                fontSize: 'var(--cr-font-size-xs)',
                color: 'var(--cr-color-text-subtle)',
              }}
            >
              {primaryRef} · {lineRangeLabel}
              {state.compare && secondaryRef && ` · vs ${secondaryRef}`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--cr-space-2)' }}>
            <button
              style={headerButtonStyle}
              onClick={switchToInline}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-accent)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-inverse)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-surface)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-text-muted)';
              }}
            >
              Open inline
            </button>
            <button
              data-part={PARTS.FILE_VIEWER_CLOSE}
              onClick={handleClose}
              aria-label="Close file viewer"
              style={headerButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-accent)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-inverse)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--cr-color-surface)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--cr-color-text-muted)';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            overflow: 'auto',
            flex: 1,
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: 'var(--cr-space-8)',
                textAlign: 'center',
                color: 'var(--cr-color-text-muted)',
                fontSize: 'var(--cr-font-size-sm)',
              }}
            >
              Loading…
            </div>
          ) : primaryContent ? (
            state.compare && secondaryContent ? (
              // Compare mode: two panes side by side
              <div
                style={{
                  display: 'flex',
                  overflow: 'hidden',
                  height: '100%',
                }}
              >
                <FilePane
                  content={secondaryContent}
                  highlightLine={highlightLine}
                  paneRef={secondaryRef}
                />
                <div
                  style={{
                    width: 1,
                    background: 'var(--cr-color-border)',
                    flexShrink: 0,
                  }}
                />
                <FilePane
                  content={primaryContent}
                  highlightLine={highlightLine}
                  paneRef={primaryRef}
                />
              </div>
            ) : (
              // Single pane
              <FilePane
                content={primaryContent}
                highlightLine={highlightLine}
              />
            )
          ) : (
            <div
              style={{
                padding: 'var(--cr-space-6)',
                textAlign: 'center',
                color: 'var(--cr-color-text-muted)',
                fontFamily: 'var(--cr-font-mono)',
                fontSize: 'var(--cr-font-size-sm)',
              }}
            >
              Could not load file.{' '}
              <span style={{ color: 'var(--cr-color-text-subtle)' }}>
                {state.file}@{state.ref}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
