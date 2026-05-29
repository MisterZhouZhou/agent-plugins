## When to use this reference

Use this reference whenever the user wants to:

- Configure Vite, TypeScript, ESLint, Prettier, build scripts, aliases or environment variables.
- Diagnose bundling, HMR, dependency optimization, CSS or asset issues.
- Improve code splitting, bundle size or production build behavior.

## How to use this reference

1. Inspect `package.json` scripts and config files first.
2. Prefer project-local conventions over introducing a new toolchain.
3. Keep framework-specific config in its native file when possible.
4. Run the smallest meaningful verification command after changes.

## Guide mapping

- `examples/vite.md` - Vite React setup, aliases, env vars and proxy.
- `examples/typescript.md` - TSConfig patterns for React projects.
- `examples/eslint.md` - lint rules and React Hooks checks.
- `examples/build-performance.md` - chunks, bundle analysis and dependency handling.
- `api/core.md` - common config file roles.

## Templates

- `templates/vite-config.md` - Vite React config template.

## Best Practices

- Do not hide type errors by loosening `tsconfig` unless there is a clear migration plan.
- Keep environment variable names aligned with the framework prefix rules.
- Treat lint and type-check failures as signals unless the user explicitly scopes them out.
- Optimize bundle size based on build output or analyzer data, not guesswork.

## Resources

- Vite docs: https://vite.dev/
- TypeScript docs: https://www.typescriptlang.org/docs/
- ESLint docs: https://eslint.org/docs/latest/

## Keywords

Vite, TypeScript, ESLint, React Refresh, tsconfig, build, HMR, environment variables, bundle splitting

