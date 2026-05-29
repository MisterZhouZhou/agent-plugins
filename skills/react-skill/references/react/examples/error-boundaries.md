# Error Boundaries

## Use for

Containing rendering failures and showing recovery UI around routes, panels or risky widgets.

## Guidance

- Place boundaries around user-visible workflow regions, not only at the app root.
- Include a reset path when retrying can help.
- Still handle async request errors in the data layer or component state; classic error boundaries catch render errors.

## Checks

- Does the fallback explain the failure without leaking internals?
- Can the user retry, navigate away or preserve unsaved work?

