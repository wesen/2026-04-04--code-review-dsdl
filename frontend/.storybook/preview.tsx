import type { Preview } from '@storybook/react-vite';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { Provider } from 'react-redux';
import '../packages/cr-walkthrough/src/tokens.css';
import '../packages/cr-walkthrough/src/theme-dark.css';
import '../packages/cr-walkthrough/src/theme-light.css';
import { walkthroughsApi } from '../packages/cr-walkthrough/src/api/walkthroughsApi';

// Global font + scrollbar styles injected into every story.
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;

const FILE_FIXTURES: Record<string, string[]> = {
  'feat/auth-refactor:src/utils/token.ts:12:48': [
    'export function createToken(payload: unknown): string {',
    '  const header = base64(JSON.stringify({ alg: "HS256", typ: "JWT" }));',
    '  const body   = base64(JSON.stringify({ ...payload, iat: Date.now() }));',
    '  const sig    = hmac(`${header}.${body}`, SECRET);',
    '  return `${header}.${body}.${sig}`;',
    '}',
    '',
    'export async function verifyToken(token: string): Promise<User> {',
    '  try {',
    '    const [header, body, sig] = token.split(".");',
    '    const payload = JSON.parse(atob(body));',
    '    if (payload.exp < Date.now() / 1000) throw new Error("expired");',
    '    if (!verifySig(`${header}.${body}`, sig)) throw new Error("invalid signature");',
    '    return { id: payload.sub, email: payload.email };',
    '  } catch (err) {',
    '    return await Session.find(token);',
    '  }',
    '}',
  ],
  'main:src/routes/users.ts:10:30': Array.from(
    { length: 21 },
    (_, index) => `export const listUsersOffset = (page = ${index + 1}) => db.users.offset(page * 20).limit(20);`
  ),
  'feat/cursor-pagination:src/routes/users.ts:10:38': Array.from(
    { length: 29 },
    (_, index) => `export const listUsersCursor = (cursor = "user_${index + 1}") => db.users.after(cursor).limit(20);`
  ),
};

const DIFF_FIXTURE = `diff --git a/src/middleware/auth.ts b/src/middleware/auth.ts
--- a/src/middleware/auth.ts
+++ b/src/middleware/auth.ts
@@ -8,7 +8,7 @@ export async function authMiddleware(req: Request, res: Response) {
-  const user = await Session.find(req.cookie.sid);
+  const user = await verifyToken(token.replace("Bearer ", ""));
   req.user = user;
 }`;

const storybookStore = configureStore({
  reducer: {
    [walkthroughsApi.reducerPath]: walkthroughsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(walkthroughsApi.middleware),
});

const makeJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const installStorybookApiMocks = () => {
  const storybookGlobal = globalThis as typeof globalThis & {
    __crStorybookFetchPatched__?: boolean;
    __crStorybookOriginalFetch__?: typeof fetch;
  };

  if (storybookGlobal.__crStorybookFetchPatched__) {
    return;
  }

  storybookGlobal.__crStorybookFetchPatched__ = true;
  storybookGlobal.__crStorybookOriginalFetch__ =
    storybookGlobal.fetch.bind(storybookGlobal);

  storybookGlobal.fetch = async (input, init) => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(requestUrl, storybookGlobal.location?.origin ?? 'http://localhost:6008');

    if (url.pathname === '/api/files/content') {
      const ref = url.searchParams.get('ref') ?? 'HEAD';
      const path = url.searchParams.get('path') ?? '';
      const start = Number(url.searchParams.get('start') ?? '1');
      const end = Number(url.searchParams.get('end') ?? '10');
      const key = `${ref}:${path}:${start}:${end}`;
      const lines =
        FILE_FIXTURES[key] ??
        Array.from(
          { length: Math.max(end - start + 1, 1) },
          (_, index) => `// ${path || 'file.ts'}:${start + index}`
        );

      return makeJsonResponse({ ref, path, start, end, lines });
    }

    if (url.pathname === '/api/files/diff') {
      return makeJsonResponse({
        from: url.searchParams.get('from') ?? 'main',
        to: url.searchParams.get('to') ?? 'HEAD',
        path: url.searchParams.get('path') ?? '',
        diff: DIFF_FIXTURE,
      });
    }

    if (url.pathname === '/api/repos/refs') {
      return makeJsonResponse({
        refs: [
          { name: 'main', type: 'branch', hash: 'b309b970f91972e298aca5da143e836402a5a20e' },
          { name: 'feat/auth-refactor', type: 'branch', hash: '30a6fdd1587ae968d1ad566078c67b08dcc111c9' },
          { name: 'feat/cursor-pagination', type: 'branch', hash: 'd3adb33fd3adb33fd3adb33fd3adb33fd3adb33f' },
        ],
      });
    }

    return storybookGlobal.__crStorybookOriginalFetch__!(input, init);
  };
};

installStorybookApiMocks();

const withStyles = (Story: React.ComponentType) => (
  <Provider store={storybookStore}>
    <style>{globalStyles}</style>
    <div
      data-widget="cr-walkthrough"
      data-theme="dark"
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: 'var(--cr-color-bg)',
        color: 'var(--cr-color-text)',
        fontFamily: 'var(--cr-font-sans)',
      }}
    >
      <Story />
    </div>
  </Provider>
);

const preview: Preview = {
  decorators: [withStyles],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#101114' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
