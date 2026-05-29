# Routing and Navigation

## Use for

Links, redirects, dynamic routes, route groups and navigation behavior in Next.js.

## Guidance

- Use `next/link` for client-side navigation between pages.
- Use dynamic route folders such as `[id]` and validate params before fetching.
- Use route groups to organize layouts without changing the URL.
- Use `redirect()` in server code when a route should not render.

## Checks

- Does navigation happen on the server or client?
- Are params awaited and validated in App Router code?
- Is the route public, authenticated or forbidden?

