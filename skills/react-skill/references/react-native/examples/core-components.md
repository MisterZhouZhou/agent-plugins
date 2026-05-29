# Core Components

## Use for

Mobile screens, rows, lists and basic layout.

## Guidance

- Use `View` for layout, `Text` for text and `Pressable` for touch interactions.
- Use `FlatList` for long or dynamic lists.
- Keep row rendering lightweight.

## Example

```tsx
import { FlatList, StyleSheet, Text, View } from "react-native";

type User = { id: string; name: string };

export function UserList({ users }: { users: User[] }) {
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 16, fontWeight: "600" },
});
```

