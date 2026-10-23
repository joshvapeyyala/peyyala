// Tests for the server actions, run against a real Postgres database (see
// tests/test-database.mts), which tests/global-setup.ts creates and migrates.
//
//   pnpm test         run once
//   pnpm test:watch   re-run on changes
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/test-database.mjs";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("src"),
      // Next.js's guard against importing server code into the browser; tests are server-side
      "server-only": path.resolve("tests/stubs/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    // Every file resets the same database, so files run one at a time
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl().href,
      // Uploads from tests go to a throwaway folder
      STORAGE_DIR: mkdtempSync(path.join(tmpdir(), "peyyala-test-storage-")),
      MAIL_DRIVER: "console",
      ADMIN_EMAIL: "admin@example.com",
      BETTER_AUTH_SECRET: "test-secret",
    },
  },
});
