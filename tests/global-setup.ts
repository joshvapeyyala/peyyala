// Runs once before all tests: creates the test database if needed and applies
// the same migrations as production, so tests run against the real schema.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { testDatabaseUrl } from "./test-database.mjs";

export default async function setup() {
  const url = testDatabaseUrl();
  const name = url.pathname.slice(1);
  // Truncating tables is fine here, and only here
  if (!name.endsWith("_test")) throw new Error(`Refusing to run tests against "${name}": the database name must end in _test.`);

  const admin = new Client({ connectionString: Object.assign(new URL(url), { pathname: "/postgres" }).href });
  try {
    await admin.connect();
  } catch {
    throw new Error(`Can't reach Postgres at ${url.host}. Start it with "pnpm db:up".`);
  }
  const { rowCount } = await admin.query("select 1 from pg_database where datname = $1", [name]);
  // A plain identifier (checked above), so it's safe to put in the statement
  if (!rowCount) await admin.query(`create database "${name}"`);
  await admin.end();

  const client = new Client({ connectionString: url.href });
  await client.connect();
  await migrate(drizzle({ client }), { migrationsFolder: "src/server/db/migrations" });
  await client.end();
}
