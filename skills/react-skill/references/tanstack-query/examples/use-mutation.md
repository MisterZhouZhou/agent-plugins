# useMutation

## Use for

Creating, updating or deleting server data.

## Guidance

- Invalidate affected queries after successful writes.
- Use optimistic updates only when rollback behavior is clear.
- Surface mutation errors close to the action that caused them.

## Example

```ts
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updateProject,
  onSuccess: (_result, input) => {
    queryClient.invalidateQueries({ queryKey: ["project", input.id] });
  },
});
```

