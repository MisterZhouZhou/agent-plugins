# Project Structure

## Use for

Planning the initial directory layout after creating a React Native app.

## Common layout

```text
MyApp/
  App.tsx
  android/
  ios/
  src/
    components/
    navigation/
    screens/
    services/
    store/
  package.json
  tsconfig.json
  metro.config.js
```

## Guidance

- Keep app code under `src/` when the project uses that convention.
- Separate screens from reusable components.
- Keep native folders untouched unless native configuration is required.

