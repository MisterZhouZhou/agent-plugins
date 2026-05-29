# Core APIs and Conventions

- `app/layout.tsx`, `app/page.tsx` - App Router routes.
- `generateMetadata` - dynamic metadata.
- `notFound()` - render not-found boundary.
- `redirect()` - server redirect.
- `cookies()` and `headers()` - request data in server code.
- `NextRequest` and `NextResponse` - middleware and route handlers.
- `next/image` - optimized images.
- `next/link` - client-side navigation.

## Checks

- Client components do not import server-only modules.
- Secrets stay in server runtime.
- Cache and dynamic behavior are intentional.

