# Data Router

## Use for

Loaders, actions, form submissions, route errors and pending navigation state.

## Guidance

- Put route-critical reads in loaders when the app already uses data routers.
- Throw responses or errors from loaders for route-level error handling.
- Keep mutations in actions or feature services, then redirect or invalidate as needed.

## Checks

- Does the route have an error element?
- Are params validated before requests?
- Does pending UI avoid double submissions?

