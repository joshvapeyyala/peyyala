import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: let phones on the local network load the dev server's scripts.
  // Without this the page renders but nothing on it responds to taps.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    agentFeedback: true,
    // Two root layouts (site, admin): unmatched URLs use app/global-not-found.tsx
    globalNotFound: true,
    // Size the build's worker pool by free memory, not CPU cores. With one
    // worker per core, builds ran out of memory on a busy 8 GB machine; small
    // servers (EC2) have the same problem.
    memoryBasedWorkersCount: true,
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
