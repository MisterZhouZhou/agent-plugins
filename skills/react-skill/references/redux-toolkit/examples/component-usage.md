# Component Usage

## Use for

Connecting React components to Redux Toolkit state with typed hooks.

## Guidance

- Define `useAppDispatch` and `useAppSelector` once near the store.
- Keep selectors stable and close to the slice.
- Dispatch actions from event handlers, thunks or Effects that synchronize with external systems.

## Example

```tsx
import { decrement, increment, selectCount } from "./counterSlice";
import { useAppDispatch, useAppSelector } from "./storeHooks";

export function Counter() {
  const count = useAppSelector(selectCount);
  const dispatch = useAppDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button type="button" onClick={() => dispatch(decrement())}>
        -
      </button>
      <button type="button" onClick={() => dispatch(increment())}>
        +
      </button>
    </div>
  );
}
```

