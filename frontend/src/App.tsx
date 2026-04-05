import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { CRWalkthrough, ThemeProvider } from '@crs-cradle/cr-walkthrough';

// ── App shell ───────────────────────────────────────────────────────

function AppShell() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <ThemeProvider initialTheme={theme}>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--cr-color-bg)',
          color: 'var(--cr-color-text)',
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
            padding: '12px 24px',
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
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </header>

        {/* Routes */}
        <main>
          <Routes>
            <Route
              path="/"
              element={<HomePrompt />}
            />
            <Route
              path="/wt/:id"
              element={<WalkthroughPage />}
            />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
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
        }}
      >
        Start: PR #482 — Refactor auth middleware
      </button>
    </div>
  );
}

// ── Walkthrough page ───────────────────────────────────────────────

function WalkthroughPage() {
  const { id } = useParams();
  return <CRWalkthrough walkthroughId={id} />;
}

// ── Theme toggle ────────────────────────────────────────────────────

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
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
          onClick={() => setTheme(t)}
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
