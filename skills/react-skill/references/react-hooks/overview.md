## When to use this reference

Use this reference whenever the user wants to:

- Use built-in React Hooks such as `useState`, `useEffect`, `useContext`, `useRef`, `useReducer`, `useMemo` or `useCallback`.
- Create custom Hooks for reusable stateful logic.
- Fix dependency arrays, stale closures, cleanup behavior or Rules of Hooks violations.
- Optimize Hook-driven components without masking incorrect state boundaries.

## How to use this reference

1. Identify which Hook best fits the requirement.
2. Apply the Rules of Hooks: call Hooks only at the top level of React components or custom Hooks.
3. Make dependencies honest and cleanup explicit.
4. Verify there are no stale closures, conditional Hook calls or unnecessary Effect-driven state updates.

## Guide mapping

- `examples/use-state-effect.md` - local state, async effects and cleanup.
- `examples/use-reducer.md` - complex local transitions.
- `examples/use-memo-callback.md` - memoization and stable callbacks.
- `examples/custom-hook.md` - reusable Hook API design.
- `api/core.md` - built-in Hooks and selection guidance.

## Templates

- `templates/use-toggle.md` - small custom Hook template.
- `templates/use-async-resource.md` - cancellable async Effect pattern.

## Best Practices

- Include all values read from the closure in dependency arrays.
- Clean up subscriptions, timers, event listeners and in-flight async updates.
- Name custom Hooks with the `use` prefix.
- Prefer `useReducer` over many coupled `useState` calls when transitions are complex.
- Use `useMemo` and `useCallback` when identity or expensive computation matters, not as default decoration.
- Do not call Hooks inside conditions, loops, callbacks or nested functions.

## Resources

- React Hooks reference: https://react.dev/reference/react
- Rules of Hooks: https://react.dev/reference/rules/rules-of-hooks

## Keywords

React Hooks, useState, useEffect, useContext, useReducer, useMemo, useCallback, useRef, custom hooks, dependency array, stale closure, cleanup

