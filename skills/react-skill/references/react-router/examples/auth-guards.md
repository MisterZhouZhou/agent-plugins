# Auth Guards

## Use for

Protected layouts, login redirects and permission-based route access.

## Guidance

- Prefer one protected layout over repeating checks in every page.
- Preserve the intended destination when redirecting to login.
- Separate unauthenticated, forbidden and loading session states.

## Example

```tsx
export function ProtectedLayout() {
  const session = useSession();
  const location = useLocation();

  if (session.status === "loading") return <Spinner />;
  if (!session.user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
```

