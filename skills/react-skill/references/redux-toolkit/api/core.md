# Core APIs

- `configureStore` - store setup with sensible defaults.
- `createSlice` - reducers and generated actions.
- `createReducer` - reducer builder API when no action generation is needed.
- `createAction` - standalone action creators.
- `createAsyncThunk` - async action lifecycle.
- `createSelector` - memoized selectors.
- `createEntityAdapter` - normalized collection helpers.
- `createApi` - RTK Query API slice.

## Checks

- Keep state serializable.
- Export typed hooks from the app store module.
- Add API middleware when using RTK Query.

