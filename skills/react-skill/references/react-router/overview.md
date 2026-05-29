## When to use this reference

Use this reference whenever the user wants to:

- Configure React Router routes, nested layouts, dynamic params, redirects, or 404 pages.
- Add data routers with loaders, actions, pending UI, errors, or forms.
- Implement auth checks, route metadata, lazy route modules, or programmatic navigation.

## How to use this reference

1. Identify whether the project uses declarative routers, data routers, framework mode, or an older route setup.
2. Follow existing route definitions and file locations.
3. Keep auth and layout checks close to route boundaries.
4. Validate URL params and search params before using them in business logic.

## Guide mapping

- `examples/basic-routing.md` - route objects, nested routes, index routes.
- `examples/data-router.md` - loaders, actions, errors, pending state.
- `examples/auth-guards.md` - protected routes and redirect handling.
- `examples/search-params.md` - URL state and query parsing.
- `api/router-hooks.md` - `useNavigate`, `useParams`, `useLocation`, `useSearchParams`, route errors.

## Templates

- `templates/router-config.md` - route object setup with lazy pages and a protected layout.

## Best Practices

- Use URL state for shareable filters, tabs, pagination and resource identifiers.
- Keep sensitive information out of URLs.
- Avoid redirect loops by making public, authenticated and forbidden states explicit.
- Prefer route-level lazy loading for large page bundles.

## Resources

- React Router docs: https://reactrouter.com/

## Keywords

React Router, route objects, BrowserRouter, RouterProvider, loader, action, useNavigate, useParams, nested routes, protected routes

