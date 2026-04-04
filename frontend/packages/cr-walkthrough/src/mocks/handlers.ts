import { http, HttpResponse } from 'msw';
import { authRefactorWalkthrough } from '../fixtures/authRefactor';

export const handlers = [
  // GET /api/walkthroughs
  http.get('/api/walkthroughs', () =>
    HttpResponse.json({
      walkthroughs: [
        {
          id: 'auth-refactor',
          path: 'walkthroughs/auth-refactor.yaml',
          title: 'PR #482: Refactor auth middleware',
          repo: 'github/acme/backend',
          base: 'main',
          head: 'feat/auth-refactor',
          authors: ['alice', 'bob'],
          stepCount: authRefactorWalkthrough.steps.length,
        },
      ],
    })
  ),

  // GET /api/walkthroughs/:id
  http.get('/api/walkthroughs/:id', ({ params }) => {
    if (params.id === 'auth-refactor') {
      return HttpResponse.json(authRefactorWalkthrough);
    }
    return HttpResponse.json({ error: 'not found' }, { status: 404 });
  }),

  // GET /api/files/content
  http.get('/api/files/content', ({ request }) => {
    const url = new URL(request.url);
    const ref = url.searchParams.get('ref') ?? 'HEAD';
    const path = url.searchParams.get('path') ?? '';
    const start = parseInt(url.searchParams.get('start') ?? '1', 10);
    const end = parseInt(url.searchParams.get('end') ?? '10', 10);

    // Return fixture-based content when available.
    const fixture = FILE_FIXTURES[`${ref}:${path}:${start}:${end}`];
    if (fixture) {
      return HttpResponse.json(fixture);
    }

    // Generic fallback.
    const lines = Array.from(
      { length: end - start + 1 },
      (_, i) => `// line ${start + i}`
    );
    return HttpResponse.json({ ref, path, start, end, lines });
  }),

  // GET /api/files/diff
  http.get('/api/files/diff', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    const path = url.searchParams.get('path') ?? '';

    const key = `${from}:${to}:${path}`;
    const fixture = DIFF_FIXTURES[key];
    if (fixture) {
      return HttpResponse.json(fixture);
    }

    return HttpResponse.json({
      from,
      to,
      path,
      diff: `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1,5 +1,6 @@\n context line\n-old line\n+new line\n context line`,
    });
  }),

  // GET /api/repos/refs
  http.get('/api/repos/refs', () =>
    HttpResponse.json({
      refs: [
        { name: 'main', type: 'branch', hash: 'b309b970f91972e298aca5da143e836402a5a20e' },
        { name: 'feat/auth-refactor', type: 'branch', hash: '30a6fdd1587ae968d1ad566078c67b08dcc111c9' },
        { name: 'v1.0.0', type: 'tag', hash: 'b309b970f91972e298aca5da143e836402a5a20e' },
      ],
    })
  ),
];

// ── Fixture lookup tables ─────────────────────────────────────────────

const FILE_FIXTURES: Record<string, object> = {
  'main:src/utils/token.ts:12:48': {
    ref: 'main',
    path: 'src/utils/token.ts',
    start: 12,
    end: 48,
    lines: [
      'export function createToken(payload: unknown): string {',
      '  const header = base64(JSON.stringify({ alg: "HS256", typ: "JWT" }));',
      '  const body   = base64(JSON.stringify({ ...payload, iat: Date.now() }));',
      '  const sig   = hmac(`${header}.${body}`, SECRET);',
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
      '    // fallback: check session DB',
      '    return await Session.find(token);',
      '  }',
      '}',
    ],
  },
  'main:src/middleware/auth.ts:1:20': {
    ref: 'main',
    path: 'src/middleware/auth.ts',
    start: 1,
    end: 20,
    lines: [
      'import { loadConfig } from "./config";',
      'import { verifyToken } from "../utils/token";',
      '',
      'export async function authMiddleware(req: Request, res: Response) {',
      '  const token = req.headers.authorization;',
      '  if (!token) return res.status(401).json({ error: "Missing authorization header" });',
      '',
      '  try {',
      '    const user = await verifyToken(token.replace("Bearer ", ""));',
      '    req.user = user;',
      '  } catch (err) {',
      '    return res.status(401).json({ error: "Unauthorized" });',
      '  }',
    ],
  },
};

const DIFF_FIXTURES: Record<string, object> = {
  'main:feat/auth-refactor:': {
    from: 'main',
    to: 'feat/auth-refactor',
    path: '',
    diff: `diff --git a/README.md b/README.md\nnew file mode 100644\nindex 0000000..430b294\n--- /dev/null\n+++ b/README.md\n@@ -0,0 +1 @@\n+# Auth refactor complete`,
  },
};
