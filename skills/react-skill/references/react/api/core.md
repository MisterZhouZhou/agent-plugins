# Core React APIs

- `useState` - local component state.
- `useReducer` - local state with explicit transitions.
- `useEffect` - synchronize with external systems.
- `useMemo` - memoize expensive derived values.
- `useCallback` - keep callback identity stable when it matters.
- `useRef` - mutable instance values and DOM refs.
- `useContext` - read provider values.
- `memo` - skip child re-rendering when props are stable.
- `lazy` and `Suspense` - code splitting and async UI boundaries.
- `createContext` - define scoped shared values.

## Checks

- Do not use Effects for pure derived state.
- Do not use memoization to hide overly broad state or Context boundaries.
- Keep Hook calls unconditional and at the top level.
- Prefer framework or data-library primitives for server data, streaming and routing behavior.
