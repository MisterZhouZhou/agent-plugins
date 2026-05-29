## When to use this reference

Use this reference whenever the user wants to:

- Build cross-platform mobile UI with React Native.
- Create or style `View`, `Text`, `Pressable`, `FlatList`, `ScrollView`, images or forms.
- Configure React Navigation, Metro, platform-specific code, native modules or mobile debugging.
- Optimize mobile list performance, memory usage and JavaScript thread work.

## How to use this reference

1. Identify whether the project uses Expo or bare React Native.
2. Follow existing navigation, styling and state conventions.
3. Verify platform behavior on both iOS and Android when the change touches native UI, navigation or dependencies.
4. Prefer React Native core components and platform APIs before adding native dependencies.

## Guide mapping

- `examples/core-components.md` - `View`, `Text`, `FlatList`, styling and mobile component basics.
- `examples/navigation.md` - React Navigation setup and typed stack routes.
- `examples/platform-specific.md` - `Platform.select`, platform files and style differences.
- `examples/performance.md` - list performance, JS thread and native dependency checks.
- `api/core.md` - common React Native APIs.

## Templates

- `templates/screen.md` - typed screen component template.
- `templates/navigation-stack.md` - native stack navigator template.

## Best Practices

- Use `FlatList` for long lists; avoid rendering large datasets in `ScrollView`.
- Provide stable `keyExtractor` values and consider `getItemLayout` for fixed-size rows.
- Use `StyleSheet.create` or the project’s existing style system for stable style definitions.
- Test iOS and Android early; use `Platform.select` for legitimate platform differences.
- Match native dependency versions with the React Native version to avoid build failures.

## Resources

- React Native docs: https://reactnative.dev/docs/getting-started
- React Navigation docs: https://reactnavigation.org/
- Expo docs: https://docs.expo.dev/

## Keywords

React Native, Expo, mobile, View, Text, FlatList, ScrollView, StyleSheet, React Navigation, Metro, native modules, iOS, Android

