# Component Basics

## Use for

Components, props, events, conditional rendering, lists and composition.

## Guidance

- Name components by domain meaning, not visual position.
- Keep props explicit and typed; avoid passing large unstructured objects unless they are true domain records.
- Use stable `key` values from data identifiers, not array indexes for editable or reorderable lists.
- Prefer composition with `children` or render props when a component owns layout but callers own content.

## Example

```tsx
type UserListProps = {
  users: Array<{ id: string; name: string; disabled?: boolean }>;
  onSelect: (id: string) => void;
};

export function UserList({ users, onSelect }: UserListProps) {
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <button type="button" disabled={user.disabled} onClick={() => onSelect(user.id)}>
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

