# useMemo and useCallback

## Use for

Expensive derived values, stable callback identity and memoized child props.

## Guidance

- Do not memoize cheap calculations by default.
- Memoization is useful when it prevents expensive work or protects a memoized child.
- If dependencies change every render, memoization will not help.

## Example

```tsx
const filteredItems = useMemo(
  () => items.filter((item) => item.name.includes(filter)),
  [items, filter],
);

const handleSelect = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

