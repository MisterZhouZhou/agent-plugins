# Vite

## Use for

Vite React setup, aliases, env vars, dev server proxy and build behavior.

## Guidance

- Use `@vitejs/plugin-react` unless the project has a different React compiler plugin.
- Vite client env vars must use the configured public prefix, commonly `VITE_`.
- Keep path aliases aligned between Vite and TypeScript.

## Checks

- Does `tsconfig` know the same aliases as Vite?
- Are env vars safe to expose to the browser?

