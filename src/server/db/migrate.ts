// Applies the migrations in ./migrations that the database hasn't had yet,
// all in one transaction: if one fails, none are applied.
//
//   pnpm db:migrate             apply pending migrations
//   pnpm db:migrate --pending   only print how many are pending (the deploy
//                               script backs the database up first if any are)
//
// Uses Drizzle's own migrator and its "already applied" table, so it's
// interchangeable with drizzle-kit migrate. Unlike drizzle-kit, it says why
// when it fails (SSL, password, SQL), which matters on the server.
// drizzle-kit is still how migrations are made: pnpm db:generate.
import "./load-env";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db, pool } from "./client";

const migrationsFolder = path.join(process.cwd(), "src/server/db/migrations");
const pendingOnly = process.argv.includes("--pending");

type Journal = { entries: { tag: string; when: number }[] };

// Migrations newer than the last applied one, the same rule Drizzle uses
async function pending() {
  const journal: Journal = JSON.parse(readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8"));
  const { rows } = await pool.query<{ ready: boolean }>("select to_regclass('drizzle.__drizzle_migrations') is not null as ready");
  let last = -1;
  if (rows[0].ready) {
    const latest = await pool.query<{ created_at: string | null }>("select max(created_at) as created_at from drizzle.__drizzle_migrations");
    last = Number(latest.rows[0].created_at ?? -1);
  }
  return journal.entries.filter((entry) => entry.when > last).map((entry) => entry.tag);
}

async function run() {
  const todo = await pending();
  if (pendingOnly) return console.log(todo.length);
  if (todo.length === 0) return console.log("✓ Database is up to date. No migrations to apply.");

  console.log(`Applying ${todo.length} migration${todo.length === 1 ? "" : "s"}: ${todo.join(", ")}`);
  await migrate(db, { migrationsFolder });
  console.log(`✓ Applied ${todo.length} migration${todo.length === 1 ? "" : "s"}.`);
}

run()
  .catch((error) => {
    // The cause too: drizzle wraps SQL errors, and the useful part is underneath
    const cause = error instanceof Error && error.cause instanceof Error ? ` (${error.cause.message})` : "";
    console.error(`✗ Migration failed, nothing was applied: ${error instanceof Error ? error.message : error}${cause}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
