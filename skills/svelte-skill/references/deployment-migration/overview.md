## When to use this reference

Use this reference whenever the user wants to:
- Deploy a SvelteKit application
- Choose or configure an adapter
- Use SSR, SPA mode, prerendering, or static output
- Improve performance, security, environment variable usage, or production behavior
- Migrate from Svelte 4/legacy syntax to Svelte 5 runes

## Deployment and adapter guide

Inspect `svelte.config.*` first:

```ts
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
```

Common choices:
- `@sveltejs/adapter-auto`: platform auto-detection, good default for Vercel/Netlify-like targets.
- `@sveltejs/adapter-node`: Node server deployment.
- `@sveltejs/adapter-static`: fully static sites or SPA fallback.
- Platform adapters: use when the hosting provider has a dedicated adapter and project already follows that target.

## Rendering decisions

- Default SvelteKit pages are server-rendered and then hydrated.
- Use `export const prerender = true` for pages that can be generated at build time.
- Use `export const ssr = false` sparingly for browser-only apps.
- Use `export const csr = false` only for intentionally non-interactive pages.
- Avoid setting global rendering options when only one route needs different behavior.

## Environment variables and security

- Use `$env/static/private` or `$env/dynamic/private` for server-only secrets.
- Use `$env/static/public` or `$env/dynamic/public` only for values safe to expose to the browser.
- Never import private env modules into client code.
- Validate form input and server route payloads at the server boundary.
- Return sanitized error messages to clients; log internal details server-side.

## Performance checklist

- Keep root layout data small.
- Lazy-load large browser-only dependencies.
- Prefer server load for data that benefits from SSR.
- Use prerendering for static marketing/docs/content pages.
- Avoid unnecessary global stores that cause wide updates.
- Use keyed blocks or keyed each blocks when identity and transitions matter.
- Check bundle output before adding heavy dependencies.

## Svelte 4 to 5 migration guide

Migrate incrementally:

1. Confirm current Svelte version and compiler options.
2. Run official migration tooling only when the user approves broad mechanical changes.
3. Convert one component or feature at a time.
4. Replace local mutable state with `$state`.
5. Replace reactive derivations with `$derived`.
6. Replace side-effect `$:` statements with `$effect`.
7. Replace `export let` with `$props`.
8. Replace component events with callback props where appropriate.
9. Add `$bindable` only for props meant to be two-way bound.
10. Run `svelte-check`, tests, and browser verification after each meaningful slice.

Legacy:

```svelte
<script>
  export let count = 0;
  $: doubled = count * 2;
</script>
```

Runes:

```svelte
<script>
  let { count = 0 } = $props();
  let doubled = $derived(count * 2);
</script>
```

## Resources

- SvelteKit adapters: https://svelte.dev/docs/kit/adapters
- Page options: https://svelte.dev/docs/kit/page-options
- Environment variables: https://svelte.dev/docs/kit/$env-static-private
- Svelte 5 migration guide: https://svelte.dev/docs/svelte/v5-migration-guide
- Svelte performance docs: https://svelte.dev/docs/svelte

## Keywords

SvelteKit deployment, adapter-auto, adapter-node, adapter-static, SSR, CSR, prerender, SPA, environment variables, security, performance, Svelte 5 migration, runes migration, legacy syntax
