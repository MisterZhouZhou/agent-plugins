# Typed Function Component

```tsx
type ExampleProps = {
  title: string;
  description?: string;
  onSelect?: () => void;
};

export function Example({ title, description, onSelect }: ExampleProps) {
  return (
    <section aria-labelledby="example-title">
      <h2 id="example-title">{title}</h2>
      {description ? <p>{description}</p> : null}
      {onSelect ? (
        <button type="button" onClick={onSelect}>
          Select
        </button>
      ) : null}
    </section>
  );
}
```

