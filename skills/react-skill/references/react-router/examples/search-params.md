# Search Params

## Use for

Shareable filters, tabs, sort, pagination and lightweight view state.

## Guidance

- Parse query values into typed values before using them.
- Keep defaults centralized.
- Use replace navigation for high-frequency changes like search typing when history spam is undesirable.

## Example

```tsx
const [params, setParams] = useSearchParams();
const page = Number(params.get("page") ?? "1");

setParams((next) => {
  next.set("page", "2");
  return next;
});
```

