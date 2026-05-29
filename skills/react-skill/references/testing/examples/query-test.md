# Query Test

## Use for

Testing components or Hooks that use TanStack Query or RTK Query.

## Guidance

- Create a fresh query client per test.
- Disable retries in tests unless retry behavior is the target.
- Mock the network boundary with the project's existing approach.

## Checks

- Tests cover loading, error and success states.
- Cache does not leak across tests.

