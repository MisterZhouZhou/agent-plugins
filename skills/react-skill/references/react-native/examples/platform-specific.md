# Platform Specific Code

## Use for

iOS and Android style differences, safe areas, native capabilities and platform file variants.

## Guidance

- Use `Platform.select` for small platform differences.
- Use `.ios.tsx` and `.android.tsx` files when behavior diverges meaningfully.
- Keep platform differences explicit and tested.

## Example

```tsx
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

