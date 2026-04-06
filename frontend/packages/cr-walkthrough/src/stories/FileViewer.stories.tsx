import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { FileViewer, buildFileViewerUrl } from '../components/FileViewer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { walkthroughsApi } from '../api/walkthroughsApi';

// ── Minimal Redux store for RTK Query ───────────────────────────────

function makeStore() {
  return configureStore({
    reducer: { [walkthroughsApi.reducerPath]: walkthroughsApi.reducer },
    middleware: (gdm) => gdm().concat(walkthroughsApi.middleware),
  });
}

// ── Story wrapper ────────────────────────────────────────────────────

const wrapper = (Story: React.ComponentType) => (
  <Provider store={makeStore()}>
    <MemoryRouter initialEntries={['/wt/auth-refactor']}>
      <Routes>
        <Route path="/wt/:id" element={<Story />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

// ── Meta ────────────────────────────────────────────────────────────

const meta: Meta<typeof FileViewer> = {
  component: FileViewer,
  tags: ['autodocs'],
  decorators: [(Story) => wrapper(Story)],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

// ── Stories ────────────────────────────────────────────────────────

/** FileViewer renders nothing when there are no file query params. */
export const Hidden: StoryObj = {
  render: () => (
    <div>
      <p style={{ color: '#888', padding: 20 }}>
        No query params — FileViewer returns null. This is the default state.
      </p>
      {/* This renders nothing, so we just check it mounts without error */}
    </div>
  ),
};

/**
 * FileViewer in single-pane mode, loaded via query params.
 * URL: /wt/auth-refactor?file=src/utils/token.ts&ref=feat/auth-refactor&lines=12,48
 *
 * Note: in Storybook (no real API) the content shows the error state.
 * The real app fetches the file content from /api/files/content.
 */
export const SinglePane: StoryObj = {
  render: () => (
    <SinglePaneRouter />
  ),
};

/** Single-pane FileViewer with a highlighted line. */
export const SinglePaneHighlighted: StoryObj = {
  render: () => (
    <SinglePaneRouter highlight="42" />
  ),
};

/** FileViewer in compare mode — two refs side by side. */
export const CompareMode: StoryObj = {
  render: () => (
    <CompareModeRouter />
  ),
};

// ── Router helpers (inline so decorators handle them) ─────────────────

/** Renders FileViewer inside a MemoryRouter with a pre-set single-pane URL. */
function SinglePaneRouter({ highlight = '' }: { highlight?: string }) {
  const searchParams = new URLSearchParams({
    file: 'src/utils/token.ts',
    ref: 'feat/auth-refactor',
    lines: '12,48',
    ...(highlight ? { highlight } : {}),
  });
  return (
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[`/wt/auth-refactor?${searchParams}`]}>
        <Routes>
          <Route path="/wt/:id" element={<FileViewer baseUrl="/wt/auth-refactor" />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

/** Renders FileViewer inside a MemoryRouter with a pre-set compare-mode URL. */
function CompareModeRouter() {
  const searchParams = new URLSearchParams({
    file: 'src/utils/token.ts',
    ref: 'feat/auth-refactor',
    lines: '12,48',
    compare: 'true',
    compareRef: 'main',
  });
  return (
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[`/wt/auth-refactor?${searchParams}`]}>
        <Routes>
          <Route path="/wt/:id" element={<FileViewer baseUrl="/wt/auth-refactor" />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

// ── Inline mode ────────────────────────────────────────────────────

/** FileViewer in inline mode — rendered in-flow, no overlay backdrop. */
export const InlineMode: StoryObj = {
  name: 'Inline mode',
  render: () => <InlineModeRouter />,
};

function InlineModeRouter() {
  const searchParams = new URLSearchParams({
    file: 'src/utils/token.ts',
    ref: 'feat/auth-refactor',
    lines: '12,48',
  });
  return (
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[`/wt/auth-refactor?${searchParams}`]}>
        <div style={{ padding: 24, background: '#101114', minHeight: '100vh' }}>
          <p style={{ color: '#888', marginBottom: 16 }}>
            Walkthrough content would appear here (inline FileViewer below).
          </p>
          <FileViewer baseUrl="/wt/auth-refactor" defaultMode="inline" />
          <p style={{ color: '#888', marginTop: 16 }}>
            The FileViewer is rendered in-flow within the page content.
          </p>
        </div>
      </MemoryRouter>
    </Provider>
  );
}

// ── buildFileViewerUrl unit stories ──────────────────────────────────

export const UrlConstruction: StoryObj = {
  name: 'buildFileViewerUrl — unit reference',
  render: () => {
    const base = '/wt/auth-refactor';
    const cases: Array<{ label: string; state: Parameters<typeof buildFileViewerUrl>[1]; expected: string }> = [
      {
        label: 'Minimal (file + ref only)',
        state: { file: 'src/auth.ts', ref: 'feat/refactor' },
        expected: '/wt/auth-refactor?file=src/auth.ts&ref=feat/refactor',
      },
      {
        label: 'With line range',
        state: { file: 'src/auth.ts', ref: 'main', startLine: 10, endLine: 30 },
        expected: '/wt/auth-refactor?file=src/auth.ts&ref=main&lines=10,30',
      },
      {
        label: 'With highlighted line',
        state: { file: 'src/auth.ts', ref: 'main', startLine: 42, endLine: 42, highlightLine: 42 },
        expected: '/wt/auth-refactor?file=src/auth.ts&ref=main&lines=42,42&highlight=42',
      },
      {
        label: 'Compare mode',
        state: { file: 'src/auth.ts', ref: 'feat/refactor', startLine: 1, endLine: 100, compare: true, compareRef: 'main' },
        expected: '/wt/auth-refactor?file=src/auth.ts&ref=feat/refactor&lines=1,100&compare=true&compareRef=main',
      },
      {
        label: 'No params → base only',
        state: {},
        expected: '/wt/auth-refactor',
      },
    ];

    return (
      <div style={{ padding: 24, fontFamily: 'var(--cr-font-mono)', fontSize: 13 }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--cr-color-text)' }}>buildFileViewerUrl unit cases</h3>
        {cases.map(({ label, state, expected }) => {
          const actual = buildFileViewerUrl(base, state);
          const ok = actual === expected;
          return (
            <div
              key={label}
              style={{
                marginBottom: 16,
                padding: 12,
                border: `1px solid ${ok ? '#2a6' : '#e44'}`,
                borderRadius: 6,
                background: ok ? '#0d2d1a' : '#2d0d0d',
              }}
            >
              <div style={{ color: ok ? '#4f8' : '#f66', marginBottom: 4, fontWeight: 600 }}>
                {ok ? '✓' : '✗'} {label}
              </div>
              <div style={{ color: '#8cf' }}>buildFileViewerUrl({JSON.stringify(state)})</div>
              <div style={{ color: '#fd8' }}>→ {actual}</div>
              {!ok && <div style={{ color: '#f88', marginTop: 4 }}>expected: {expected}</div>}
            </div>
          );
        })}
      </div>
    );
  },
  parameters: {
    layout: 'padded',
  },
};
