## When to use this reference

Use this reference whenever the user wants to:

- Fetch, cache, refetch, mutate or invalidate server state in React.
- Model loading, error, stale, optimistic or paginated data states.
- Replace ad hoc `useEffect` data fetching with a cache-aware data layer.

## How to use this reference

1. Distinguish server state from local UI state.
2. Define stable query keys that include every parameter affecting the request.
3. Keep query functions pure and framework-appropriate.
4. Use mutations for writes and invalidate or update affected queries deliberately.

## Guide mapping

- `examples/query-client.md` - provider setup and defaults.
- `examples/use-query.md` - reads, enabled queries, query keys.
- `examples/use-mutation.md` - writes, invalidation, optimistic updates.
- `examples/pagination.md` - paginated and infinite queries.
- `api/core.md` - common TanStack Query APIs.

## Templates

- `templates/query-hook.md` - typed query Hook template.

## Best Practices

- Put all request parameters into the query key.
- Avoid copying query data into component state for display-only flows.
- Use `staleTime` and invalidation based on product freshness requirements.
- Handle empty, loading, error and refetching states distinctly in user-facing UI.

## Resources

- TanStack Query docs: https://tanstack.com/query/latest

## Keywords

TanStack Query, React Query, QueryClient, useQuery, useMutation, invalidateQueries, query keys, staleTime, optimistic updates

