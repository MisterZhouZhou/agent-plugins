# Route Handlers

## Use for

API-like endpoints in the App Router.

## Guidance

- Keep authentication, authorization and validation server-side.
- Return `Response` or `NextResponse`.
- Avoid importing route handlers into client components.

## Example

```ts
export async function GET() {
  return Response.json({ ok: true });
}
```

