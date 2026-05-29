# Configuration

## Use for

`next.config`, image domains, env vars, redirects, rewrites and compiler behavior.

## Guidance

- Keep secrets out of client-exposed environment variables.
- Prefer `remotePatterns` for external images.
- Use redirects for URL changes and rewrites for proxy-like routing.
- Keep experimental options documented near the reason they are enabled.

## Checks

- Does the project use `next.config.js`, `.mjs` or `.ts`?
- Are image hostnames explicit?
- Will redirects create loops?

