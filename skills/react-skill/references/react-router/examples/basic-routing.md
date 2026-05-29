# Basic Routing

## Use for

Route objects, nested routes, layouts, index routes and catch-all routes.

## Guidance

- Use layout routes for shared navigation and page chrome.
- Use index routes for default child content.
- Keep route modules lazy when pages are large.

## Example

```tsx
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "projects/:projectId", element: <ProjectPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
```

