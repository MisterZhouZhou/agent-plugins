# Query Client

## Use for

Creating and providing a TanStack Query client.

## Guidance

- Create the client once at app setup, not inside frequently rendered components.
- Tune defaults based on product freshness and retry needs.

## Example

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

