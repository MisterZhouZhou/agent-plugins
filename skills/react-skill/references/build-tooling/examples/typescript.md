# TypeScript Config

## Use for

TSConfig, JSX settings, path aliases and strictness decisions.

## Guidance

- Keep `jsx` aligned with the framework and compiler.
- Avoid lowering strictness to bypass errors without a migration reason.
- Prefer project references only when the repo structure needs them.

## Checks

- Does the app have separate configs for app, tests and Node tooling?
- Are generated files included or excluded intentionally?

