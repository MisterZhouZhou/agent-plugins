# Data Fetching

## Use for

Server-side fetches, cache behavior, revalidation and dynamic rendering.

## Guidance

- Make cache behavior explicit when freshness matters.
- Use route segment config or fetch options consistently.
- Avoid client fetching for data that can render on the server without interactivity.

## Example

```ts
const project = await fetch(`${baseUrl}/projects/${id}`, {
  next: { revalidate: 60 },
}).then((res) => res.json());
```

