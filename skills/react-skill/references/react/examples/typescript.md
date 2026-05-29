# TypeScript

## Use for

Typing props, events, refs, reducer actions, API data and reusable components.

## Guidance

- Prefer `type Props = { ... }` near the component.
- Use discriminated unions for variants with different required props.
- Type event handlers at the function boundary when inference is unclear.
- Avoid `React.FC` unless the local codebase already standardizes on it.

## Example

```tsx
type ButtonProps =
  | { variant: "link"; href: string; onClick?: never }
  | { variant: "button"; href?: never; onClick: () => void };
```

