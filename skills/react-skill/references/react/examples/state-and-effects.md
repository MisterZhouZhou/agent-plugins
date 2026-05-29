# State and Effects

## Use for

Local state, reducers, derived values and synchronization with external systems.

## Guidance

- Use `useState` for simple local state and `useReducer` for multi-step state transitions.
- Do not put derived values into state when they can be calculated during render.
- Use `useEffect` for subscriptions, timers, imperative DOM integration and external synchronization.
- Clean up every subscription, timer and request listener created inside an Effect.

## Example

```tsx
const visibleItems = items.filter((item) => item.name.includes(search));

useEffect(() => {
  const unsubscribe = source.subscribe(setValue);
  return unsubscribe;
}, [source]);
```

