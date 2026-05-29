# Hook Test

## Use for

Testing custom Hooks with state transitions, async work or subscriptions.

## Guidance

- Use the project's existing `renderHook` helper if present.
- Wrap providers in a test wrapper.
- Prefer component tests when Hook behavior is only meaningful through UI.

## Checks

- Are timers, network calls and subscriptions controlled?
- Does cleanup run on unmount?

