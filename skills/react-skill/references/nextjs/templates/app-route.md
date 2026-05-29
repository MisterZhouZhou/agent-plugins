# App Router Template

```tsx
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Example",
};

export default async function ExamplePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main>
      <h1>Example {id}</h1>
    </main>
  );
}
```

