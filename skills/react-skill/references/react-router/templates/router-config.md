# Router Config

```tsx
import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: () => import("@/pages/HomePage"),
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: "settings",
            lazy: () => import("@/pages/SettingsPage"),
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
```

