## When to use this reference

Use this reference whenever the user wants to:

- Create a new React Native or Expo project.
- Choose between Expo and bare React Native CLI.
- Configure TypeScript, Metro, native folders and initial app structure.
- Add early navigation or state-management dependencies after initialization.

## How to use this reference

1. Gather project name, package manager, Expo vs bare CLI, TypeScript preference and native requirements.
2. Run the smallest initialization command that creates a runnable app.
3. Verify the default app starts before adding navigation, state management or native dependencies.
4. For bare iOS projects, run CocoaPods install after adding native dependencies.

## Guide mapping

- `examples/expo.md` - Expo project creation.
- `examples/react-native-cli.md` - bare React Native CLI project creation.
- `examples/project-structure.md` - common source layout.
- `api/commands.md` - initialization and run commands.

## Templates

- `templates/project-structure.md` - starting directory layout.

## Best Practices

- Use Expo for most new apps unless custom native constraints require bare workflow.
- Lock Node.js and React Native versions for reproducible builds.
- Keep organization/package identifiers consistent across iOS and Android.
- Add native dependencies incrementally and verify after each addition.
- Set up CI early for type-checking, tests and platform builds.

## Resources

- React Native environment setup: https://reactnative.dev/docs/environment-setup
- Expo create project: https://docs.expo.dev/get-started/create-a-project/

## Keywords

React Native init, Expo, create-expo-app, React Native CLI, mobile project, TypeScript, Metro, CocoaPods, iOS, Android

