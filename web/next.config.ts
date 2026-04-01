import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              // Allow inline scripts so Next.js runtime and dev tooling work correctly.
              "script-src 'self' 'unsafe-inline';",
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data:;",
              "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000;",
              "frame-ancestors 'none';",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
