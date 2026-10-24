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
    // Uploads live in an S3 bucket (src/server/storage.ts); next/image only
    // loads images from addresses listed here
    remotePatterns: process.env.STORAGE_PUBLIC_URL ? [new URL(`${process.env.STORAGE_PUBLIC_URL}/**`)] : [],
  },
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Browsers trust the declared file type instead of guessing
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          // No other site can show these pages in a frame (clickjacking), forms
          // only post here, and no plugins. A policy for scripts would need a
          // fresh nonce per request, which would stop pages being prerendered.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          // HTTPS only, once a browser has seen the site over HTTPS (ignored over plain HTTP)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        // Covers what the admin layout's noindex metadata can't, like redirects
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
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
