# Async Thunk

## Use for

Async client workflows that are not best modeled as cached API reads.

## Guidance

- Return typed payloads from the thunk.
- Handle pending, fulfilled and rejected states explicitly.
- Prefer RTK Query or TanStack Query for normal API cache state.

## Example

```ts
export const saveDraft = createAsyncThunk(
  "drafts/save",
  async (draft: DraftInput, { rejectWithValue }) => {
    try {
      return await api.saveDraft(draft);
    } catch {
      return rejectWithValue("Unable to save draft");
    }
  },
);
```

