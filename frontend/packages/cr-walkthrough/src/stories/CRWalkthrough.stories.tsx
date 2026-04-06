import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CRWalkthrough, ThemeProvider } from '../components/CRWalkthrough';
import { walkthroughsApi } from '../api/walkthroughsApi';
import { authRefactorWalkthrough } from '../fixtures/authRefactor';
import { FileViewer, buildFileViewerUrl } from '../components/FileViewer';
import type { Walkthrough } from '../types';
import type { FileViewerState } from '../components/FileViewer';

// ── Default story ──────────────────────────────────────────────────

const meta: Meta<typeof CRWalkthrough> = {
  component: CRWalkthrough,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <ThemeProvider initialTheme="dark">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <Story />
      </ThemeProvider>
    ),
  ],
};
export default meta;

// ── Stories ────────────────────────────────────────────────────────

export const Default: StoryObj<{ walkthrough: Walkthrough }> = {
  name: 'CRWalkthrough — dark (default)',
  args: {
    walkthrough: authRefactorWalkthrough,
  },
  render: (args) => <CRWalkthrough walkthrough={args.walkthrough} />,
};

export const LightTheme: StoryObj<{ walkthrough: Walkthrough }> = {
  name: 'CRWalkthrough — light theme',
  decorators: [
    (Story) => (
      <ThemeProvider initialTheme="light">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <Story />
      </ThemeProvider>
    ),
  ],
  args: {
    walkthrough: authRefactorWalkthrough,
  },
  render: (args) => <CRWalkthrough walkthrough={args.walkthrough} />,
};

export const Unstyled: StoryObj<{ walkthrough: Walkthrough }> = {
  name: 'CRWalkthrough — unstyled (no base CSS)',
  args: {
    walkthrough: authRefactorWalkthrough,
  },
  render: (args) => (
    <CRWalkthrough walkthrough={args.walkthrough} unstyled />
  ),
};

export const CustomTokens: StoryObj<{ walkthrough: Walkthrough }> = {
  name: 'CRWalkthrough — custom token overrides',
  args: {
    walkthrough: authRefactorWalkthrough,
  },
  render: (args) => (
    <CRWalkthrough
      walkthrough={args.walkthrough}
      tokens={{
        '--cr-color-source-step': '#ff6600',
        '--cr-color-diff-step': '#ff00ff',
        '--cr-radius-lg': '0px',
        '--cr-font-mono': 'monospace',
      }}
    />
  ),
};

export const LoadingState: StoryObj = {
  name: 'CRWalkthrough — loading state',
  render: () => (
    <CRWalkthrough
      walkthroughId="auth-refactor"
      walkthrough={undefined}
    />
  ),
};

export const ErrorState: StoryObj = {
  name: 'CRWalkthrough — error state',
  decorators: [
    (Story) => (
      <ThemeProvider initialTheme="dark">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        `}</style>
        <Story />
      </ThemeProvider>
    ),
  ],
  render: () => (
    <div>
      {/* Simulate error by not providing walkthrough and having no walkthroughId */}
      <CRWalkthrough walkthrough={undefined} walkthroughId={undefined} />
    </div>
  ),
};

export const SingleTextStep: StoryObj = {
  name: 'CRWalkthrough — single text step',
  render: () => (
    <CRWalkthrough
      walkthrough={{
        id: 'minimal',
        title: 'Minimal Walkthrough',
        repo: 'example/repo',
        base: 'main',
        head: 'feat/test',
        authors: ['tester'],
        steps: [
          {
            type: 'text',
            body: 'Hello, this is a minimal walkthrough with a single text step.',
          },
        ],
      }}
    />
  ),
};

// ── M3–M5: Cross-linking integration ─────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: { [walkthroughsApi.reducerPath]: walkthroughsApi.reducer },
    middleware: (gdm) => gdm().concat(walkthroughsApi.middleware),
  });
}

function CrossLinkWalkthrough({ walkthrough }: { walkthrough: Walkthrough }) {
  const navigate = useNavigate();
  const handleOpenFile = (state: FileViewerState) => {
    navigate(buildFileViewerUrl('/wt/auth-refactor', state));
  };
  return <CRWalkthrough walkthrough={walkthrough} onOpenFile={handleOpenFile} />;
}

/**
 * CRWalkthrough with cross-linking enabled.
 *
 * Clicking the file badge on any `source` step opens the FileViewer overlay
 * showing that file at the specified line range.
 *
 * In Storybook (no real API) the content shows the "could not load file" state.
 * The `FileViewer` stories show the fully-loaded cases.
 */
export const WithCrossLinking: StoryObj = {
  name: 'CRWalkthrough — with FileViewer cross-linking',
  decorators: [
    (Story) => (
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/wt/auth-refactor']}>
          <ThemeProvider initialTheme="dark">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>
            <div style={{ minHeight: '100vh', background: '#101114' }}>
              <Story />
            </div>
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    ),
  ],
  render: () => (
    <div style={{ position: 'relative' }}>
      <CrossLinkWalkthrough walkthrough={authRefactorWalkthrough} />
      {/* Pre-load FileViewer with query params so it appears open */}
      <FileViewer baseUrl="/wt/auth-refactor" />
    </div>
  ),
};

/**
 * Same as WithCrossLinking but with a highlighted line pre-set.
 * URL: /wt/auth-refactor?file=src/utils/token.ts&ref=feat/auth-refactor&lines=42,42&highlight=42
 */
export const WithCrossLinkingHighlighted: StoryObj = {
  name: 'CRWalkthrough — FileViewer with highlighted line',
  decorators: [
    (Story) => (
      <Provider store={makeStore()}>
        <MemoryRouter
          initialEntries={[
            '/wt/auth-refactor?file=src/utils/token.ts&ref=feat/auth-refactor&lines=42,42&highlight=42',
          ]}
        >
          <ThemeProvider initialTheme="dark">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>
            <div style={{ minHeight: '100vh', background: '#101114' }}>
              <Story />
            </div>
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    ),
  ],
  render: () => (
    <div style={{ position: 'relative' }}>
      <CrossLinkWalkthrough walkthrough={authRefactorWalkthrough} />
      <FileViewer baseUrl="/wt/auth-refactor" />
    </div>
  ),
};

export const AllStepTypes: StoryObj = {
  name: 'CRWalkthrough — all step types in one',
  render: () => (
    <CRWalkthrough
      walkthrough={{
        id: 'all-types',
        title: 'All Step Types Demo',
        repo: 'example/repo',
        base: 'main',
        head: 'feat/all-types',
        authors: ['demo'],
        steps: [
          { type: 'text', body: 'Text step — introduces the walkthrough.' },
          { type: 'source', file: 'src/main.ts', lines: [1, 5], note: 'Entry point.' },
          { type: 'code', lang: 'typescript', body: 'const x = 42; // inline code' },
          { type: 'shell', cmd: 'npm install', output: 'added 142 packages' },
          { type: 'link', url: 'https://example.com', label: 'Example link' },
          {
            type: 'annotation',
            file: 'src/main.ts',
            line: 3,
            severity: 'info',
            body: 'This is an informational note.',
          },
          {
            type: 'checkpoint',
            prompt: 'Is this correct?',
            choices: [
              { text: 'Yes', correct: true, explain: 'Correct!' },
              { text: 'No', correct: false, explain: 'Try again.' },
            ],
          },
          {
            type: 'reveal',
            label: 'Show answer',
            body: 'The answer is 42.',
          },
          {
            type: 'section',
            title: 'Deep dive',
            steps: [
              { type: 'text', body: 'Nested text inside a section.' },
            ],
          },
          {
            type: 'branch',
            prompt: 'Where to next?',
            options: [
              { label: 'Overview', goto: 'overview' },
              { label: 'Deep dive', goto: 'deep' },
            ],
          },
        ],
      }}
    />
  ),
};
