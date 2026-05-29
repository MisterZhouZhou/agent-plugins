# Component Test

## Use for

Testing rendered output and user interactions.

## Guidance

- Query by role and accessible name when possible.
- Use `userEvent` instead of manually firing low-level events.
- Assert visible behavior, not component internals.

## Example

```tsx
render(<SaveButton onSave={onSave} />);
await user.click(screen.getByRole("button", { name: /save/i }));
expect(onSave).toHaveBeenCalledOnce();
```

