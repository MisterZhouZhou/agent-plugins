# useReducer

## Use for

State with multiple fields that change together or state transitions that should be named and testable.

## Guidance

- Model actions as a discriminated union in TypeScript.
- Keep reducer logic pure.
- Use reducer state for UI workflow state, not remote cache data.

## Example

```tsx
type State = { count: number; step: number };
type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setStep"; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: action.payload };
  }
}
```

