# Custom Hook

## Use for

Reusable behavior that needs React state, Effects, context or other Hooks.

## Guidance

- Keep the input parameters explicit.
- Return a small API that matches how components use the behavior.
- Avoid a generic Hook that bundles unrelated product concerns.

## Example

```tsx
import { useCallback, useState } from "react";

export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((current) => !current), []);
  return [value, toggle];
}
```

