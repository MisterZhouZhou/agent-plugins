# Core APIs

- `QueryClient` - cache and defaults.
- `QueryClientProvider` - React provider.
- `useQuery` - cached reads.
- `useSuspenseQuery` - suspense-based reads.
- `useMutation` - writes.
- `useQueryClient` - imperative cache access.
- `invalidateQueries` - mark matching queries stale.
- `setQueryData` - direct cache update.

## Checks

- Query keys are stable arrays.
- Query functions reject on HTTP failures if the fetch wrapper does not.
- Mutations update or invalidate every affected query.

