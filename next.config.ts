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
    // Uploads (screenshots, the resume) go through server actions: 5 MB files
    // plus the form's own overhead. The default is 1 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    // Local uploads are served from /uploads, which next/image allows as a
    // local path. Files in S3 need their address listed here.
    remotePatterns: process.env.STORAGE_PUBLIC_URL ? [new URL(`${process.env.STORAGE_PUBLIC_URL}/**`)] : [],
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
