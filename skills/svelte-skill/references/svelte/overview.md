## When to use this reference

Use this reference whenever the user wants to:
- Build or refactor Svelte components
- Choose between Svelte 5 runes and legacy Svelte syntax
- Work with props, events, slots/snippets, actions, lifecycle, transitions, animations, or bindings
- Fix reactivity bugs, component API issues, accessibility problems, or TypeScript typing in `.svelte` files

## How to use this reference

1. Identify the installed Svelte version from `package.json`.
2. Inspect nearby components before changing syntax style.
3. Use Svelte 5 runes for new Svelte 5 code unless the existing project is intentionally legacy.
4. Keep legacy syntax in older components unless migration is explicitly requested.
5. For exact API details, consult the official docs:
   - Svelte docs: https://svelte.dev/docs/svelte
   - Svelte 5 migration guide: https://svelte.dev/docs/svelte/v5-migration-guide
   - Svelte tutorial: https://svelte.dev/tutorial

## Svelte 5 component patterns

### State and derived values

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count += 1;
  }
</script>

<button onclick={increment}>
  {count} / {doubled}
</button>
```

- Use `$state` for local reactive state.
- Use `$derived` for computed values.
- Use `$effect` for side effects, subscriptions, imperative integrations, analytics, or DOM/browser interactions that cannot be expressed declaratively.
- Prefer event properties like `onclick` in runes-mode components.

### Props and bindable values

```svelte
<script lang="ts">
  type Props = {
    label: string;
    value?: number;
    oncommit?: (value: number) => void;
  };

  let { label, value = $bindable(0), oncommit }: Props = $props();
</script>

<label>
  {label}
  <input
    type="number"
    bind:value
    onblur={() => oncommit?.(value)}
  />
</label>
```

- Use `$props()` instead of `export let` in Svelte 5 runes components.
- Use callback props for child-to-parent events.
- Use `$bindable` only when the parent is meant to bind and mutate the value.

## Legacy component patterns

Use this style for Svelte 3/4 projects or components already written in legacy mode:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let value = 0;

  const dispatch = createEventDispatcher<{ commit: number }>();

  $: doubled = value * 2;
</script>

<button on:click={() => dispatch('commit', doubled)}>
  {label}: {doubled}
</button>
```

- Use `export let` for props.
- Use `$:` for reactive declarations/statements.
- Use `on:event` for DOM events and `createEventDispatcher` for component events.

## Best practices

- Prefer semantic HTML and native form controls before custom ARIA-heavy widgets.
- Keep component props minimal and typed.
- Put DOM-dependent code in lifecycle-safe locations (`onMount` or guarded by browser checks in SvelteKit).
- Use keyed each blocks when identity matters: `{#each items as item (item.id)}`.
- Avoid mutating props directly; use callbacks, bindings, stores, or local copies based on ownership.
- Use component actions for reusable DOM behavior, not for business state.
- Keep transitions and animations respectful of reduced-motion preferences in production UI.

## Keywords

Svelte, Svelte 5, runes, $state, $derived, $effect, $props, $bindable, legacy mode, $:, export let, components, props, events, slots, snippets, actions, lifecycle, transitions, animations, accessibility, TypeScript
