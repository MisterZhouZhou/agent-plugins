# Performance

## Use for

Render profiling, memoization, bundle splitting and reducing unnecessary updates.

## Guidance

- Measure before optimizing.
- Prefer moving state down over adding memoization everywhere.
- Use `memo`, `useMemo` and `useCallback` when they protect expensive work or stable child props.
- Split large routes and rarely used panels with `lazy` or framework-level lazy loading.

## Checks

- Is the slow work CPU, network, layout or bundle size?
- Is Context causing too many subscribers to re-render?
- Are list rows keyed and virtualized when the list is large?

