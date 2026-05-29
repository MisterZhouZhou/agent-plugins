# Router Hooks

## Common APIs

- `useNavigate()` - imperative navigation.
- `useParams()` - dynamic path params.
- `useSearchParams()` - URL query state.
- `useLocation()` - current location and navigation state payload.
- `useLoaderData()` - loader result for data routers.
- `useRouteError()` - route error boundary data.
- `useNavigation()` - pending navigation state.

## Checks

- Validate params before using them.
- Avoid storing sensitive data in `location.state` or query strings.
- Keep route-dependent code inside components rendered under a router.

