# Next Config

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/old",
        destination: "/new",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

