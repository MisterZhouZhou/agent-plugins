# App Router

## Use for

`app/` directory routing, layouts, pages, loading, error and not-found files.

## Guidance

- Use nested `layout.tsx` files for shared UI.
- Keep route-specific loading and error UI near the route.
- Use route groups for organization without changing URL paths.

## Common files

- `layout.tsx` - shared shell.
- `page.tsx` - route content.
- `loading.tsx` - suspense fallback.
- `error.tsx` - client error boundary.
- `not-found.tsx` - 404 UI.

