# Context

## Use for

Theme, auth session, feature flags, i18n and other values read by many descendants.

## Guidance

- Keep providers scoped as low as practical.
- Split state and actions into separate contexts when broad re-renders become a problem.
- Do not use Context as a default replacement for props or data caches.

## Example

```tsx
const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
```

