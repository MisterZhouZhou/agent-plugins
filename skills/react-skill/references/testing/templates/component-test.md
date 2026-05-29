# Component Test Template

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Example } from "./Example";

describe("Example", () => {
  it("calls onSelect when the button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<Example title="Report" onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /select/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

