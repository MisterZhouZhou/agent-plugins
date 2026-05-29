# Core Config Files

- `package.json` - scripts, dependencies and package manager hints.
- `vite.config.ts` - Vite plugins, aliases, server and build config.
- `tsconfig.json` - TypeScript project behavior.
- `eslint.config.*` or `.eslintrc.*` - lint rules.
- `.env*` - environment variables.
- `vitest.config.*` or `jest.config.*` - tests.

## Checks

- Config aliases stay consistent.
- Public env vars do not contain secrets.
- Verification scripts exist and are used after edits.

