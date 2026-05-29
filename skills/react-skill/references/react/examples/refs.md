# Refs

## Use for

DOM focus, measuring, scrolling, integration with imperative libraries and uncontrolled inputs.

## Guidance

- Refs are mutable and changing them does not trigger render.
- Prefer state for values that affect visible UI.
- Use `forwardRef` or explicit props for imperative access only when a component contract needs it.

## Example

```tsx
const inputRef = useRef<HTMLInputElement>(null);

function focusSearch() {
  inputRef.current?.focus();
}
```

