import React, { createContext, useContext, useState, useEffect } from 'react';
import { PARTS } from '../parts';
import { StepCard } from '../renderers/StepCard';
import { useGetWalkthroughQuery } from '../api/walkthroughsApi';
import type { Walkthrough } from '../types';

// ── Theme context ────────────────────────────────────────────────────

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'dark',
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Props ───────────────────────────────────────────────────────────

interface CRWalkthroughProps {
  /** Walkthrough ID — fetches from the API via RTK Query */
  walkthroughId?: string;
  /** Inline walkthrough data (skip API fetch) */
  walkthrough?: Walkthrough;
  /** Extra CSS class on root */
  className?: string;
  /** Remove base styles (keep only data-part markup) */
  unstyled?: boolean;
  /** Additional CSS custom properties to override tokens */
  tokens?: Record<string, string>;
  /** Called when a branch step option is selected */
  onBranch?: (gotoId: string) => void;
  /** Called when the widget theme changes so the outer chrome can sync */
  onThemeChange?: (theme: Theme) => void;
}

// ── Component ───────────────────────────────────────────────────────

export const CRWalkthrough: React.FC<CRWalkthroughProps> = ({
  walkthroughId,
  walkthrough,
  className,
  unstyled = false,
  tokens,
  onBranch,
  onThemeChange,
}) => {
  const { theme } = useTheme();

  // Notify the outer chrome when the theme changes.
  useEffect(() => {
    onThemeChange?.(theme);
  }, [theme, onThemeChange]);

  const { data, isLoading, isError, error } =
    useGetWalkthroughQuery(walkthroughId!, { skip: !walkthroughId });

  const wt = walkthrough ?? data;

  return (
    <div
      data-widget="cr-walkthrough"
      data-theme={theme}
      data-part={PARTS.ROOT}
      className={className}
      style={{
        // Import theme styles if not unstyled
        ...(unstyled
          ? {}
          : {
              background: 'var(--cr-color-bg)',
              color: 'var(--cr-color-text)',
              fontFamily: 'var(--cr-font-sans)',
              fontSize: 'var(--cr-font-size-root)',
              minHeight: '100vh',
              padding: 'var(--cr-space-6)',
              boxSizing: 'border-box',
            }),
        // Custom token overrides
        ...tokens,
      }}
    >
      {/* Header */}
      {wt && (
        <header data-part={PARTS.HEADER} style={{ marginBottom: 'var(--cr-space-6)' }}>
          <h1
            data-part={PARTS.HEADER_TITLE}
            style={{
              margin: 0,
              fontSize: 'var(--cr-font-size-2xl)',
              fontWeight: 'var(--cr-font-weight-bold)',
              letterSpacing: '-0.02em',
              color: 'var(--cr-color-text)',
              lineHeight: 'var(--cr-line-height-tight)',
            }}
          >
            {wt.title}
          </h1>
          <div
            data-part={PARTS.HEADER_META}
            style={{
              marginTop: 'var(--cr-space-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cr-space-3)',
              fontSize: 'var(--cr-font-size-sm)',
              color: 'var(--cr-color-text-muted)',
            }}
          >
            <span>{wt.repo}</span>
            <span>·</span>
            <span>
              {wt.base} → {wt.head}
            </span>
            {wt.authors.length > 0 && (
              <>
                <span>·</span>
                <span data-part={PARTS.HEADER_AUTHORS}>{wt.authors.join(', ')}</span>
              </>
            )}
          </div>
        </header>
      )}

      {/* Loading state */}
      {isLoading && (
        <p style={{ color: 'var(--cr-color-text-muted)' }}>
          Loading walkthrough…
        </p>
      )}

      {/* Error state */}
      {isError && (
        <p
          style={{
            color: 'var(--cr-color-severity-issue)',
            padding: 'var(--cr-space-3)',
            borderRadius: 'var(--cr-radius-md)',
            background: 'var(--cr-color-diff-del-bg)',
          }}
        >
          Failed to load walkthrough: {String(error)}
        </p>
      )}

      {/* Steps */}
      {wt && (
        <div data-part={PARTS.STEPS_LIST}>
          {wt.steps.map((step, i) => (
            <StepCard
              key={step.id ?? i}
              step={step}
              index={String(i + 1)}
              onGoto={onBranch}
            />
          ))}
        </div>
      )}
    </div>
  );
};
