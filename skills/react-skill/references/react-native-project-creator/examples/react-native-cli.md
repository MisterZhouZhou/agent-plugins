# React Native CLI Project Creation

## Use for

Bare React Native projects that need direct native iOS/Android control.

## Command

```bash
npx @react-native-community/cli init MyApp
```

## After creation

```bash
cd MyApp
npm install
cd ios && pod install && cd ..
npx react-native run-ios
npx react-native run-android
```

## Checks

- Is the native build environment installed?
- Does the project need a specific bundle identifier/package name?
- Are iOS pods installed after native dependency changes?

