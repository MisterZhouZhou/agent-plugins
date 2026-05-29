# Commands

## Expo

```bash
npx create-expo-app MyApp --template blank-typescript
npm start
```

## React Native CLI

```bash
npx @react-native-community/cli init MyApp
npx react-native run-ios
npx react-native run-android
```

## iOS native dependencies

```bash
cd ios && pod install && cd ..
```

## Checks

- Use the package manager already standard in the workspace.
- Avoid adding navigation or state dependencies before the default app runs.
- Re-run platform builds after native dependency changes.

