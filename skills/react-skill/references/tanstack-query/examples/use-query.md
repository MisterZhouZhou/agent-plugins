# useQuery

## Use for

Reading server state with caching, loading and error states.

## Guidance

- Include every request parameter in the query key.
- Use `enabled` for dependent queries.
- Keep `queryFn` free of component-only side effects.

## Example

```ts
const projectQuery = useQuery({
  queryKey: ["project", projectId],
  queryFn: () => getProject(projectId),
  enabled: Boolean(projectId),
});
```

