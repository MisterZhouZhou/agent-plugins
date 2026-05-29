# Custom Hooks

## Use for

Reusable component behavior that uses React state, Effects, context or other Hooks.

## Guidance

- Name custom Hooks with `use`.
- Keep Hook inputs explicit and return a stable, small public API.
- Do not hide unrelated product workflows in one generic Hook.
- Test custom Hooks when they contain branching logic, async behavior or subscriptions.

## Example

```tsx
export function useDisclosure(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  return {
    open,
    close: () => setOpen(false),
    toggle: () => setOpen((value) => !value),
  };
}
```

