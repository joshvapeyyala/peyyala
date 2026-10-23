import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let phones on the local network load the dev server's scripts.
  // Without this the page renders but nothing on it responds to taps.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    agentFeedback: true,
    // Two root layouts (site, admin): unmatched URLs use app/global-not-found.tsx
    globalNotFound: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
