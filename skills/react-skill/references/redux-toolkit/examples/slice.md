# Slice

## Use for

Feature reducers, generated actions and local selectors.

## Guidance

- Keep the slice name stable.
- Use Immer-style mutations inside reducers.
- Export actions, reducer and selectors intentionally.

## Example

```ts
const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    added(state, action: PayloadAction<Todo>) {
      state.items.push(action.payload);
    },
  },
});
```

