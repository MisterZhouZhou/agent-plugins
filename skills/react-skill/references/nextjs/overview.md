## When to use this reference

Use this reference whenever the user wants to:

- Build or maintain a Next.js application.
- Work with App Router, Pages Router, layouts, route handlers, metadata, middleware or deployment.
- Decide between Server Components, Client Components, SSR, SSG and ISR.
- Handle Next.js caching, data fetching, images, fonts, redirects or environment variables.

## How to use this reference

1. Identify whether the project uses `app/`, `pages/`, or both.
2. In App Router projects, keep components server-rendered by default.
3. Add `"use client"` only for interactive client-only boundaries.
4. Use framework-native data fetching, metadata and routing conventions before adding custom abstractions.
5. When the task is documentation-driven, map the request to the matching official docs area before opening examples.

## Mapping Rules

The reference follows the same high-level structure as the Next.js docs:

- App Router topics map to Next.js docs under `https://nextjs.org/docs/app/...`.
- Pages Router topics map to Next.js docs under `https://nextjs.org/docs/pages/...`.
- Architecture topics map to Next.js docs under `https://nextjs.org/docs/architecture/...`.
- Community topics map to Next.js docs under `https://nextjs.org/docs/community/...`.

Path rule: remove numeric prefixes from source doc folders or filenames; index pages map to `index.md` in the corresponding directory.

## Guide mapping

- `examples/app-router.md` - layouts, pages, loading, error and not-found files.
- `examples/server-client-components.md` - server/client boundaries and prop serialization.
- `examples/data-fetching.md` - fetch caching, revalidation, dynamic rendering.
- `examples/route-handlers.md` - request handlers and server-only logic.
- `examples/routing-and-navigation.md` - links, redirects, dynamic routes and navigation.
- `examples/configuration.md` - `next.config`, images, env vars, redirects and rewrites.
- `api/core.md` - common Next.js APIs and conventions.

## Templates

- `templates/app-route.md` - App Router page and layout pattern.
- `templates/next-config.md` - `next.config` patterns.
- `templates/project-structure.md` - App Router, Pages Router and hybrid layouts.

## Best Practices

- Keep secrets and privileged code in server-only modules.
- Avoid pushing large client bundles by moving non-interactive work to Server Components.
- Make cache behavior explicit for data that affects correctness.
- Use `next/image`, metadata APIs and route conventions when available in the project.

## Resources

- Next.js docs: https://nextjs.org/docs

## Keywords

Next.js, App Router, Pages Router, Server Components, Client Components, SSR, SSG, ISR, route handlers, middleware
