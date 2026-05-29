# Build Performance

## Use for

Bundle size, code splitting, dependency optimization and production build diagnosis.

## Guidance

- Inspect actual build output before optimizing.
- Split by route or heavy feature boundary.
- Avoid importing large libraries into shared root components when only one page needs them.

## Checks

- Are duplicate dependencies bundled?
- Are dynamic imports placed at user-visible boundaries?
- Is the slow path dev startup, HMR, type-checking or production build?

