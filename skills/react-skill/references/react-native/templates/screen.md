# Screen Template

```tsx
import { StyleSheet, Text, View } from "react-native";

type ExampleScreenProps = {
  title: string;
};

export function ExampleScreen({ title }: ExampleScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});
```

