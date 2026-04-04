import type { Walkthrough } from '../types';

// ── Auth Refactor walkthrough fixture ─────────────────────────────
// Mirrors the auth-refactor.yaml fixture from the Go backend testdata.

export const authRefactorWalkthrough: Walkthrough = {
  id: 'auth-refactor',
  title: 'PR #482: Refactor auth middleware',
  repo: 'github/acme/backend',
  base: 'main',
  head: 'feat/auth-refactor',
  authors: ['alice', 'bob'],
  steps: [
    {
      type: 'text',
      id: 'step-1',
      body: 'This PR replaces the legacy session-based auth with JWT tokens.\nWe\'ll walk through the changes bottom-up, starting at the token utility layer.',
    },
    {
      type: 'source',
      id: 'step-2',
      file: 'src/utils/token.ts',
      lines: [12, 48],
      highlight: [30, 35],
      ref: 'feat/auth-refactor',
      note: 'New verifyToken helper — note the fallback on L34.',
    },
    {
      type: 'diff',
      id: 'step-3',
      file: 'src/middleware/auth.ts',
      hunks: [2, 3],
      collapse: false,
      ref: 'feat/auth-refactor',
      note: 'Session lookup replaced with verifyToken call.',
    },
    {
      type: 'code',
      id: 'step-4',
      lang: 'typescript',
      body: '// Before (conceptual)\nconst user = await Session.find(req.cookie.sid);\n\n// After\nconst user = decodeJWT(req.headers.authorization);',
    },
    {
      type: 'annotation',
      id: 'step-5',
      file: 'src/middleware/auth.ts',
      line: 42,
      severity: 'warn',
      body: 'Race condition if token refresh fires mid-request.',
    },
    {
      type: 'checkpoint',
      id: 'step-6',
      prompt: 'What happens if the token is expired?',
      choices: [
        {
          text: 'Returns 401 Unauthorized',
          correct: true,
          explain: 'See L34 — the catch block returns early.',
        },
        {
          text: 'Falls back to session auth',
          correct: false,
          explain: 'Session fallback was removed in this PR.',
        },
        {
          text: 'Silently ignores the error',
          correct: false,
          explain: 'No — expired tokens always throw.',
        },
      ],
    },
    {
      type: 'reveal',
      id: 'step-7',
      label: 'Show edge-case discussion',
      body: 'If the clock is skewed >30s, `exp` validation can reject valid tokens. We may want `clockTolerance` in the verify options.',
    },
    {
      type: 'link',
      id: 'step-8',
      url: 'https://jwt.io/introduction',
      label: 'JWT primer (external)',
    },
  ],
};
