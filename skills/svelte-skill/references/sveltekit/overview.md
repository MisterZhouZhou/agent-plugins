## When to use this reference

Use this reference whenever the user wants to:
- Build or debug a SvelteKit application
- Add routes, layouts, nested layouts, dynamic routes, route groups, or error pages
- Implement `load`, form actions, server routes, hooks, cookies, redirects, or errors
- Decide where code should run: browser, universal load, server load, server endpoint, or hook
- Work with SSR, prerendering, trailing slash behavior, environment variables, or generated `$types`

## How to use this reference

1. Confirm this is SvelteKit by checking for `@sveltejs/kit`, `src/routes`, and `svelte.config.*`.
2. Inspect the nearest route directory before adding files.
3. Choose the narrowest SvelteKit file boundary:
   - UI only: `+page.svelte`, `+layout.svelte`
   - public/universal data: `+page.ts`, `+layout.ts`
   - secrets, cookies, database, private APIs: `+page.server.ts`, `+layout.server.ts`
   - mutations from forms: `+page.server.ts` actions
   - HTTP endpoints: `+server.ts`
   - cross-cutting request logic: `hooks.server.ts`
4. For exact API details, consult official docs:
   - SvelteKit docs: https://svelte.dev/docs/kit
   - Routing: https://svelte.dev/docs/kit/routing
   - Load: https://svelte.dev/docs/kit/load
   - Form actions: https://svelte.dev/docs/kit/form-actions
   - Hooks: https://svelte.dev/docs/kit/hooks
   - Adapters: https://svelte.dev/docs/kit/adapters

## File routing quick map

```text
src/routes/
  +layout.svelte
  +layout.ts
  +page.svelte
  +page.ts
  +page.server.ts
  +error.svelte
  blog/
    [slug]/
      +page.svelte
      +page.server.ts
  api/
    users/
      +server.ts
```

## Load functions

Universal `load` runs during SSR and client navigation:

```ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch(`/api/posts/${params.slug}`);

  if (!response.ok) {
    return { post: null };
  }

  return {
    post: await response.json()
  };
};
```

Server `load` is for private server-side work:

```ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const post = await locals.db.post.findUnique({ slug: params.slug });

  if (!post) {
    error(404, 'Post not found');
  }

  return { post };
};
```

## Form actions

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email') ?? '');

    if (!email.includes('@')) {
      return fail(400, { email, invalid: true });
    }

    await locals.users.invite(email);
    redirect(303, '/team');
  }
};
```

Use `use:enhance` in the page only when progressive enhancement behavior is needed beyond the default browser submission.

## Server routes

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const users = await locals.db.user.findMany();
  return json({ users });
};
```

## Best practices

- Treat `+page.server.ts`, `+layout.server.ts`, `+server.ts`, and `hooks.server.ts` as the natural place for secrets and privileged work.
- Return only client-safe data from load functions.
- Use generated `./$types` types instead of manually spelling route event types.
- Use `redirect(...)`, `error(...)`, and `fail(...)` helpers instead of ad hoc response objects in load/actions.
- Keep parent layout data small and stable; avoid forcing every page to refetch large unrelated data.
- Prefer URL params/search params for shareable page state.
- Use route groups for organization without changing URLs.

## Keywords

SvelteKit, routing, +page.svelte, +layout.svelte, load, PageLoad, PageServerLoad, actions, form actions, +server.ts, hooks, cookies, locals, SSR, prerender, adapters, redirects, errors, fail, enhance, route groups
