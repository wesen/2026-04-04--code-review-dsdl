import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Walkthrough,
  WalkthroughSummary,
  FileContent,
  DiffContent,
} from '../types';

// ── API slice ────────────────────────────────────────────────────────

export const walkthroughsApi = createApi({
  reducerPath: 'walkthroughsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Walkthrough', 'WalkthroughList'],
  endpoints: (builder) => ({
    listWalkthroughs: builder.query<{ walkthroughs: WalkthroughSummary[] }, void>({
      query: () => '/walkthroughs',
      providesTags: (result) =>
        result
          ? [
              ...result.walkthroughs.map(({ id }) => ({
                type: 'Walkthrough' as const,
                id,
              })),
              'WalkthroughList',
            ]
          : ['WalkthroughList'],
    }),

    getWalkthrough: builder.query<Walkthrough, string>({
      query: (id) => `/walkthroughs/${id}`,
      providesTags: (result, _error, id) =>
        result ? [{ type: 'Walkthrough', id }] : [],
    }),

    getFileContent: builder.query<
      FileContent,
      { ref: string; path: string; start: number; end: number }
    >({
      query: ({ ref, path, start, end }) =>
        `/files/content?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(
          path
        )}&start=${start}&end=${end}`,
    }),

    getFileDiff: builder.query<
      DiffContent,
      { from: string; to: string; path?: string }
    >({
      query: ({ from, to, path }) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (path) params.set('path', path);
        return `/files/diff?${params.toString()}`;
      },
    }),

    listRefs: builder.query<{ refs: RefInfo[] }, void>({
      query: () => '/repos/refs',
    }),
  }),
});

export const {
  useListWalkthroughsQuery,
  useGetWalkthroughQuery,
  useGetFileContentQuery,
  useGetFileDiffQuery,
  useListRefsQuery,
} = walkthroughsApi;

export interface RefInfo {
  name: string;
  type: 'branch' | 'tag';
  hash: string;
}
