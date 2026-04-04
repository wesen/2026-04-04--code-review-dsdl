import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { CodeRenderer } from '../renderers/CodeRenderer';
import type { CodeStep } from '../types';

const meta: Meta<typeof CodeRenderer> = {
  component: CodeRenderer,
  tags: ['autodocs'],
  decorators: [(Story) => (
    <div style={{ background: '#101114', padding: 16, borderRadius: 8 }}>
      <Story />
    </div>
  )],
};
export default meta;

export const Default: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      lang: 'typescript',
      body: '// Before\nconst user = await Session.find(req.cookie.sid);\n\n// After\nconst user = decodeJWT(req.headers.authorization);',
    },
  },
};

export const TypeScript: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      lang: 'typescript',
      body: 'const payload = JSON.parse(atob(token.split(".")[1]));\nconst user = await db.users.findById(payload.sub);',
    },
  },
};

export const Python: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      lang: 'python',
      body: 'def paginate(query, cursor=None, limit=10):\n    q = db.query(query)\n    if cursor:\n        q = q.filter(id > cursor)\n    return q.limit(limit + 1).all()',
    },
  },
};

export const SQL: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      lang: 'sql',
      body: 'SELECT id, name, email\nFROM users\nWHERE id > :cursor\nORDER BY id ASC\nLIMIT :limit;',
    },
  },
};

export const NoLang: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      body: 'a = b + c\nresult = fn(a)\nreturn result',
    },
  },
};

export const LongSnippet: StoryObj<{ step: CodeStep }> = {
  render: (args) => <CodeRenderer step={args.step} />,
  args: {
    step: {
      type: 'code',
      lang: 'typescript',
      body: `export async function paginate(
  query: SelectQuery,
  cursor?: string,
  limit = 10
): Promise<PaginatedResult> {
  const q = db.createQueryBuilder(query);

  if (cursor) {
    q.andWhere('id > :cursor', { cursor: decodeCursor(cursor) });
  }

  q.take(limit + 1);
  const results = await q.getMany();

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? encodeCursor(items.at(-1)!.id) : undefined;

  return { items, nextCursor };
}`,
    },
  },
};
