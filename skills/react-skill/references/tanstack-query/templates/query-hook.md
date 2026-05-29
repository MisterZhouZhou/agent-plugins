# Query Hook Template

```ts
import { useQuery } from "@tanstack/react-query";

export function useExample(id: string) {
  return useQuery({
    queryKey: ["example", id],
    queryFn: () => fetchExample(id),
    enabled: Boolean(id),
  });
}
```

