# Performance

## Use for

Large lists, animation jank, memory pressure and native dependency issues.

## Guidance

- Use `FlatList`, `SectionList` or virtualization for long lists.
- Memoize expensive row components when props are stable.
- Avoid heavy synchronous work on the JavaScript thread.
- Check native dependency compatibility before upgrading React Native.

## Checks

- Are list keys stable?
- Is image size appropriate for the device?
- Does the issue reproduce on both iOS and Android?
- Is the bottleneck render work, JS thread work, bridge/native calls or network?

