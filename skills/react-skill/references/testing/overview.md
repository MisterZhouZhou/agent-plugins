## When to use this reference

Use this reference whenever the user wants to:

- Add or fix tests for React components, hooks, routes, stores or data fetching.
- Choose between unit, integration and browser-level tests.
- Use React Testing Library with Vitest or Jest.

## How to use this reference

1. Inspect existing test runner and helpers before adding new dependencies.
2. Test behavior from the user's perspective where practical.
3. Mock network and platform boundaries, not implementation details.
4. Prefer focused regression tests for bug fixes.

## Guide mapping

- `examples/component-test.md` - render, query, user events and assertions.
- `examples/hook-test.md` - testing custom Hooks.
- `examples/router-test.md` - components that depend on routes.
- `examples/query-test.md` - TanStack Query tests with isolated clients.
- `api/core.md` - common testing utilities and gotchas.

## Templates

- `templates/component-test.md` - React Testing Library component test.

## Best Practices

- Prefer `getByRole` and accessible names over brittle selectors.
- Use `userEvent` for realistic interactions.
- Keep tests deterministic by controlling timers, network and random data.
- Verify loading, error, empty and success states for data-heavy UI.

## Resources

- React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro/
- Vitest docs: https://vitest.dev/
- Jest docs: https://jestjs.io/

## Keywords

React Testing Library, Vitest, Jest, jsdom, userEvent, renderHook, MSW, component test, integration test

