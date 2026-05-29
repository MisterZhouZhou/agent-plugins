## When to use this reference

Use this reference whenever the user wants to:

- Set up or modify Redux Toolkit stores, slices, reducers, selectors, middleware or async thunks.
- Manage complex client state shared across many features.
- Connect React components with typed selector and dispatch hooks.
- Add middleware, selectors and normalized state patterns.
- Use RTK Query for API data, caching and invalidation.
- Migrate older hand-written Redux code to Redux Toolkit.

## How to use this reference

1. Confirm that global client state is actually needed.
2. Keep feature slices near the feature when the project already follows feature folders.
3. Use `createSlice` for reducers and actions.
4. Use `createAsyncThunk` for imperative async flows, or RTK Query for API cache state.
5. Connect UI through typed `useAppSelector` and `useAppDispatch` hooks instead of repeating `RootState` and `AppDispatch` annotations in every component.

## Guide mapping

- `examples/store-setup.md` - `configureStore`, typed hooks, provider setup.
- `examples/slice.md` - state, reducers, prepare callbacks, selectors.
- `examples/async-thunk.md` - pending/fulfilled/rejected lifecycle.
- `examples/rtk-query.md` - API slice, endpoints, tags and invalidation.
- `examples/component-usage.md` - typed React Redux usage in components.
- `api/core.md` - common Redux Toolkit APIs.

## Templates

- `templates/slice.md` - typed slice template.

## Best Practices

- Keep state serializable unless middleware is explicitly configured.
- Normalize collections when updates target individual entities.
- Keep selectors close to slices and export a small public surface.
- Do not store remote cache data twice when RTK Query or TanStack Query already owns it.
- Reducers must stay pure; put network, timers and persistence in thunks, middleware, RTK Query or the calling layer.

## Resources

- Redux Toolkit docs: https://redux-toolkit.js.org/
- Redux docs: https://redux.js.org/

## Keywords

Redux Toolkit, Redux, configureStore, createSlice, createAsyncThunk, createSelector, RTK Query, Provider, useSelector, useDispatch
