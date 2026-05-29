# Core Testing APIs

- `render` - mount components in a test DOM.
- `screen` - query rendered output.
- `userEvent.setup()` - realistic user interactions.
- `waitFor` - wait for async expectations.
- `within` - scope queries to a region.
- `renderHook` - test Hooks when supported by the project.
- `vi` or `jest` - mocks, spies and timers depending on runner.

## Checks

- Prefer role/name queries.
- Avoid testing private state directly.
- Use existing project setup files and custom render helpers.

