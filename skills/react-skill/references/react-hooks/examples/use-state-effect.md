# useState and useEffect

## Use for

Local state and synchronization with external systems such as network requests, subscriptions, timers and browser APIs.

## Guidance

- Initialize loading, error and data state deliberately.
- Reset state when the input identity changes.
- Guard async updates after unmount or parameter changes.
- Prefer a data library for cache-heavy server state.

## Example

```tsx
import { useEffect, useState } from "react";

type UserState =
  | { status: "loading"; user: null; error: null }
  | { status: "success"; user: User; error: null }
  | { status: "error"; user: null; error: Error };

export function useUserData(userId: string) {
  const [state, setState] = useState<UserState>({
    status: "loading",
    user: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", user: null, error: null });

    fetch(`/api/users/${userId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load user");
        return response.json() as Promise<User>;
      })
      .then((user) => {
        if (!cancelled) setState({ status: "success", user, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ status: "error", user: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}
```

