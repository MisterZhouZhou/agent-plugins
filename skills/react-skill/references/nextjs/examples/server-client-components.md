# Server and Client Components

## Use for

Choosing Server Component or Client Component boundaries.

## Guidance

- Server Components are the default in App Router.
- Add `"use client"` for event handlers, state, effects, browser APIs and client-only libraries.
- Pass serializable props from Server Components into Client Components.
- Keep client boundaries small to reduce bundle size.

## Checks

- Does this component need interactivity?
- Does it access secrets or server-only modules?
- Can the data fetching stay on the server?

