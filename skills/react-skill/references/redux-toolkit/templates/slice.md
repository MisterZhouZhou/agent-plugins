# Slice Template

```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ExampleState = {
  selectedId: string | null;
};

const initialState: ExampleState = {
  selectedId: null,
};

export const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    selected(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    cleared(state) {
      state.selectedId = null;
    },
  },
});

export const { selected, cleared } = exampleSlice.actions;
export const exampleReducer = exampleSlice.reducer;
```

