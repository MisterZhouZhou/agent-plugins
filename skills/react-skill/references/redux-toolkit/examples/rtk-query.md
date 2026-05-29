# RTK Query

## Use for

API cache state in Redux Toolkit projects.

## Guidance

- Define one API slice per base API domain unless the project has a reason to split.
- Use tags for invalidation.
- Prefer generated hooks in components.

## Example

```ts
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    getProject: builder.query<Project, string>({
      query: (id) => `projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),
  }),
});
```

