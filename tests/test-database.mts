// The database tests run against: DATABASE_URL's database with "_test" added
// (peyyala -> peyyala_test), so your own data is never touched. Shared by
// vitest.config.mts and global-setup.ts, which run in separate processes.
// A CommonJS package: the config loads this file as ESM, which needs the default import
import nextEnv from "@next/env";

export function testDatabaseUrl() {
  nextEnv.loadEnvConfig(process.cwd());
  const url = new URL(process.env.DATABASE_URL ?? "postgres://peyyala:peyyala@localhost:5432/peyyala");
  url.pathname = `${url.pathname.replace(/_test$/, "")}_test`;
  return url;
}
