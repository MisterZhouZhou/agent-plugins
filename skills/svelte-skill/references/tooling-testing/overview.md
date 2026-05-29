## When to use this reference

Use this reference whenever the user wants to:
- Configure Svelte/SvelteKit with Vite or TypeScript
- Run or fix `svelte-check`, linting, formatting, unit tests, component tests, or e2e tests
- Add Vitest, Testing Library, Playwright, ESLint, Prettier, or project scripts
- Diagnose build, type generation, alias, or preprocess issues

## Project inspection checklist

Look for:
- `package.json` scripts and dependency versions
- `svelte.config.js` or `svelte.config.ts`
- `vite.config.ts`
- `tsconfig.json` and generated `.svelte-kit/tsconfig.json`
- `eslint.config.*`, `.prettierrc`, `vitest.config.*`, `playwright.config.*`
- Existing `*.test.ts`, `*.spec.ts`, or `e2e/` patterns

## Common scripts

Prefer the project's existing scripts. Typical SvelteKit scripts look like:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "prettier --check . && eslint .",
    "format": "prettier --write .",
    "test:unit": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## TypeScript guidance

- Use `lang="ts"` in Svelte components when the project already uses TypeScript.
- Use SvelteKit generated types from `./$types` for route files.
- Let `svelte-kit sync` generate route types before running `svelte-check`.
- Use `$lib` alias according to the existing project config.
- Avoid hand-writing ambient types when generated types are available.

## Unit and component testing

Use the project's existing test framework. For Vitest:

```ts
import { describe, expect, it } from 'vitest';

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(12)).toBe('$12.00');
  });
});
```

For Svelte component tests, follow existing Testing Library patterns if present:

```ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.svelte';

it('increments', async () => {
  const user = userEvent.setup();
  render(Counter);

  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

## E2E testing

Use Playwright for browser workflows:

```ts
import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

## Best practices

- Run the narrowest reliable command first, then broaden to build/check when behavior is stable.
- Do not add a new test framework when the project already has one.
- Keep tests focused on observable behavior, not Svelte implementation details.
- Use accessible queries in component and e2e tests.
- For frontend changes, run the dev server and inspect at least one desktop and one mobile viewport when feasible.
- Treat `svelte-check` failures as first-class type/template issues, not lint noise.

## Resources

- SvelteKit project creation: https://svelte.dev/docs/kit/creating-a-project
- SvelteKit TypeScript: https://svelte.dev/docs/kit/types
- svelte-check: https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check
- Vitest: https://vitest.dev/
- Testing Library Svelte: https://testing-library.com/docs/svelte-testing-library/intro/
- Playwright: https://playwright.dev/

## Keywords

SvelteKit tooling, Vite, TypeScript, svelte-check, ESLint, Prettier, Vitest, Testing Library, Playwright, component tests, e2e tests, build, dev server
