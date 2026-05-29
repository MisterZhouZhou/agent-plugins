## When to use this reference

Use this reference whenever the user wants to:

- Build React components, pages, hooks, providers, or UI flows.
- Work with JSX, props, component composition, context, refs, forms, lists, events, suspense, lazy loading, or error boundaries.
- Make React code type-safe with TypeScript.
- Improve rendering behavior, accessibility, performance, or component architecture.

## How to use this reference

1. Identify whether the work is component-local, app-wide, routing-related, server-rendered, or data-fetching related.
2. Prefer existing project conventions before introducing new React patterns.
3. Open the matching example or template only when the task needs concrete syntax.
4. For API details that may have changed, consult official React documentation before making broad claims.

## Guide mapping

**Core React**
- `examples/component-basics.md` - components, props, conditional rendering, lists, events.
- `examples/state-and-effects.md` - local state boundaries, derived values and external synchronization.
- `examples/context.md` - provider design, scoped context, avoiding over-broad context.
- `examples/refs.md` - DOM refs, imperative handles, uncontrolled inputs.

**Architecture**
- `examples/custom-hooks.md` - extracting reusable behavior.
- `examples/error-boundaries.md` - failure boundaries and recovery UI.
- `examples/performance.md` - memoization, render profiling, code splitting.
- `examples/accessibility.md` - semantic HTML, focus, keyboard and ARIA checks.

**TypeScript**
- `examples/typescript.md` - props, event types, generics, discriminated unions.

**API**
- `api/core.md` - common React APIs and when to reach for them.

## Templates

- `templates/component.md` - typed function component template.
- `templates/hook.md` - custom Hook template.

## Best Practices

- Keep components small enough to expose one clear UI contract.
- Lift state to the nearest common owner; do not jump directly to global state.
- Always provide stable keys for list rendering.
- Do not mirror props into state unless editing a draft or intentionally resetting from a key.
- Prefer derived values during render over Effect-driven state updates.
- Treat dependency arrays as a correctness tool, not a lint obstacle.
- Use semantic HTML first; add ARIA only when native semantics are insufficient.
- Use `lazy`/`Suspense` or route-level code splitting for large feature boundaries.

## Resources

- React docs: https://react.dev/
- React API reference: https://react.dev/reference/react

## Keywords

React, JSX, TSX, Hooks, useState, useEffect, useReducer, useMemo, useCallback, useRef, Context, Suspense, Error Boundary, TypeScript
