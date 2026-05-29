# Core Hooks

- `useState` - independent local state.
- `useReducer` - complex local transitions.
- `useEffect` - external synchronization and cleanup.
- `useLayoutEffect` - layout reads/writes before paint; use sparingly.
- `useContext` - read provider values.
- `useRef` - mutable values and DOM/native refs.
- `useMemo` - memoized derived values.
- `useCallback` - memoized functions.
- `useId` - stable IDs for accessibility attributes.
- `useTransition` - mark non-urgent UI updates.
- `useDeferredValue` - defer expensive rendering from fast-changing input.

## Selection rules

- If the value affects rendering, use state or reducer.
- If the value is mutable but should not trigger render, use ref.
- If the work talks to the outside world, use Effect and cleanup.
- If the work is pure derivation, calculate during render or memoize when expensive.

