import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { CRWalkthrough, ThemeProvider, useTheme, FileViewer, buildFileViewerUrl } from '@crs-cradle/cr-walkthrough';

// ── App shell ───────────────────────────────────────────────────────

function AppShell() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // CRWalkthrough's ThemeProvider calls this when its internal theme changes
  // so we can sync the outer chrome to the same value.
  const handleThemeChange = useCallback((t: 'dark' | 'light') => {
    setTheme(t);
  }, []);

  return (
    <ThemeProvider initialTheme={theme}>
      <Shell theme={theme} onThemeChange={handleThemeChange} />
    </ThemeProvider>
  );
}

// Shell must be inside ThemeProvider so it can use useTheme().
function Shell({
  theme,
  onThemeChange,
}: {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}) {
  const { setTheme } = useTheme();

  const handleToggle = (t: 'dark' | 'light') => {
    setTheme(t);
    onThemeChange(t);
  };

  return (
    <div
      data-widget="cr-walkthrough"
      data-theme={theme}
      style={{
        minHeight: '100vh',
        background: 'var(--cr-color-bg)',
        color: 'var(--cr-color-text)',
        fontFamily: 'var(--cr-font-sans)',
        fontSize: 'var(--cr-font-size-root)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--cr-space-4) var(--cr-space-6)',
          borderBottom: '1px solid var(--cr-color-border)',
          background: 'var(--cr-color-surface)',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 'var(--cr-font-size-base)',
            color: 'var(--cr-color-text)',
          }}
        >
          Code Review Walkthrough
        </span>
        <ThemeToggle theme={theme} onToggle={handleToggle} />
      </header>

      {/* Routes */}
      <main>
        <Routes>
          <Route path="/" element={<HomePrompt />} />
          <Route path="/wt/:id" element={<WalkthroughPage onThemeChange={handleToggle} />} />
          <Route path="/file" element={<FilePage />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Home prompt ──────────────────────────────────────────────────────

function HomePrompt() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--cr-space-6)',
        textAlign: 'center',
        padding: '0 var(--cr-space-6)',
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--cr-font-size-3xl)',
            fontWeight: 'var(--cr-font-weight-bold)',
            letterSpacing: '-0.02em',
            color: 'var(--cr-color-text)',
            lineHeight: 'var(--cr-line-height-tight)',
          }}
        >
          Code Review Walkthroughs
        </h1>
        <p
          style={{
            marginTop: 'var(--cr-space-3)',
            color: 'var(--cr-color-text-muted)',
            fontSize: 'var(--cr-font-size-lg)',
          }}
        >
          Interactive, step-by-step code review guides.
        </p>
      </div>

      <button
        onClick={() => navigate('/wt/auth-refactor')}
        style={{
          padding: 'var(--cr-space-3) var(--cr-space-6)',
          borderRadius: 'var(--cr-radius-md)',
          background: 'var(--cr-color-accent)',
          color: 'var(--cr-color-inverse)',
          border: 'none',
          fontWeight: 600,
          fontSize: 'var(--cr-font-size-base)',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
      >
        Start: PR #482 — Refactor auth middleware
      </button>
    </div>
  );
}

// ── Walkthrough page ────────────────────────────────────────────────

function WalkthroughPage({
  onThemeChange,
}: {
  onThemeChange: (t: 'dark' | 'light') => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return null;

  const baseUrl = `/wt/${id}`;

  const handleOpenFile = useCallback(
    (state: Parameters<typeof buildFileViewerUrl>[1]) => {
      navigate(buildFileViewerUrl(baseUrl, state));
    },
    [navigate, baseUrl]
  );

  return (
    <>
      <CRWalkthrough
        walkthroughId={id}
        onThemeChange={onThemeChange}
        onOpenFile={handleOpenFile}
      />
      {/* FileViewer renders when query params are present; null otherwise */}
      <FileViewer baseUrl={baseUrl} />
    </>
  );
}

// ── Standalone file view page ─────────────────────────────────────────

function FilePage() {
  const navigate = useNavigate();

  return (
    <ThemeProvider initialTheme="dark">
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--cr-color-bg)',
          color: 'var(--cr-color-text)',
          fontFamily: 'var(--cr-font-sans)',
          fontSize: 'var(--cr-font-size-root)',
        }}
      >
        {/* Minimal toolbar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--cr-space-3) var(--cr-space-6)',
            borderBottom: '1px solid var(--cr-color-border)',
            background: 'var(--cr-color-surface)',
            gap: 'var(--cr-space-4)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--cr-radius-sm)',
              border: '1px solid var(--cr-color-border)',
              background: 'var(--cr-color-surface)',
              color: 'var(--cr-color-text-muted)',
              fontSize: 'var(--cr-font-size-sm)',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <span
            style={{
              fontSize: 'var(--cr-font-size-sm)',
              color: 'var(--cr-color-text-subtle)',
              fontFamily: 'var(--cr-font-mono)',
            }}
          >
            File viewer
          </span>
        </header>

        {/* FileViewer reads its own query params — /file?file=&ref=&lines=&highlight=&compare=&compareRef= */}
        <div style={{ padding: 'var(--cr-space-6)' }}>
          <FileViewer baseUrl="/file" defaultMode="inline" />
        </div>
      </div>
    </ThemeProvider>
  );
}

// ── Theme toggle ────────────────────────────────────────────────────

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'dark' | 'light';
  onToggle: (t: 'dark' | 'light') => void;
}) {
  return (
    <div
      role="group"
      aria-label="Select theme"
      style={{
        display: 'flex',
        gap: 'var(--cr-space-1)',
        background: 'var(--cr-color-surface-raised)',
        borderRadius: 'var(--cr-radius-sm)',
        padding: '2px',
      }}
    >
      {(['dark', 'light'] as const).map((t) => (
        <button
          key={t}
          onClick={() => onToggle(t)}
          aria-pressed={theme === t}
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--cr-radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--cr-font-size-sm)',
            fontWeight: theme === t ? 600 : 400,
            background: theme === t ? 'var(--cr-color-accent)' : 'transparent',
            color:
              theme === t
                ? 'var(--cr-color-inverse)'
                : 'var(--cr-color-text-muted)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
