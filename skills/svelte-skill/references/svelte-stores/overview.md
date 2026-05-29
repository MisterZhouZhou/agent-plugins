## When to use this reference

Use this reference whenever the user wants to:
- Share state between Svelte components
- Use `writable`, `readable`, `derived`, custom stores, or store contracts
- Decide between local component state, context, stores, and SvelteKit load data
- Persist client state or bridge external subscriptions into Svelte

## Decision guide

- Local component-only state: use component state (`$state` in Svelte 5 or local variables in legacy components).
- Parent-child coordination: use props, callback props/events, or binding when ownership is clear.
- Deep tree dependency: use context when state belongs to one subtree.
- Cross-route or cross-feature client state: use stores.
- Server-derived page data: use SvelteKit `load`, not a global store.
- User/session/auth truth: use server data and cookies first; mirror client state only as a convenience.

## Basic store patterns

```ts
import { derived, writable } from 'svelte/store';

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export const todos = writable<Todo[]>([]);

export const remaining = derived(todos, ($todos) =>
  $todos.filter((todo) => !todo.done).length
);
```

In `.svelte` legacy-compatible templates, subscribe with `$storeName`:

```svelte
<script lang="ts">
  import { remaining, todos } from '$lib/stores/todos';
</script>

<p>{$remaining} remaining</p>

{#each $todos as todo (todo.id)}
  <label>
    <input type="checkbox" bind:checked={todo.done} />
    {todo.title}
  </label>
{/each}
```

## Custom stores

```ts
import { writable } from 'svelte/store';

function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update((value) => value + 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

## Context pattern

```ts
// src/lib/context/session.ts
import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';

const SESSION = Symbol('session');

export function setSession(session: Readable<{ id: string } | null>) {
  setContext(SESSION, session);
}

export function getSession() {
  return getContext<Readable<{ id: string } | null>>(SESSION);
}
```

## Best practices

- Keep store modules free of direct browser API usage unless they are client-only and guarded.
- Prefer custom stores for domain operations so callers do not duplicate update logic.
- Do not use stores as a replacement for SvelteKit `load` data that must be fetched per request.
- Avoid putting secrets or server-only objects in stores imported by client code.
- In SvelteKit SSR, be careful with module-level mutable stores because they can leak state between requests if used for per-user server data.
- For persistence, initialize in the browser and handle missing/invalid stored data defensively.

## Resources

- Svelte stores: https://svelte.dev/docs/svelte/stores
- Svelte context: https://svelte.dev/docs/svelte/context
- SvelteKit state management: https://svelte.dev/docs/kit/state-management

## Keywords

Svelte stores, writable, readable, derived, custom stores, store contract, context, state management, SSR state, persistence, SvelteKit load data
