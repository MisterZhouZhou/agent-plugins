# Custom Hook

```tsx
import { useEffect, useState } from "react";

export function useExampleValue(sourceId: string) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const nextValue = await fetchExampleValue(sourceId);
      if (!ignore) setValue(nextValue);
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [sourceId]);

  return value;
}
```

