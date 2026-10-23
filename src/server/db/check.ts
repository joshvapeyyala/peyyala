// Runs before `next build` (pnpm build). The build prerenders pages from the
// database, so this fails fast with a plain message instead of a long query
// error from deep inside the build.
import "./load-env";
import { Client } from "pg";

const url = process.env.DATABASE_URL;

async function check() {
  if (!url) return fail("DATABASE_URL is not set. Copy .env.example to .env.local.");

  // Host and database only: never print the password
  const { hostname, port, pathname } = new URL(url);
  const where = `${hostname}:${port || 5432}${pathname}`;

  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
  } catch {
    return fail(`Can't reach the database at ${where}. Locally, start it with "pnpm db:up".`);
  }

  try {
    const { rows } = await client.query<{ ready: boolean }>("select to_regclass('public.profile') is not null as ready");
    if (!rows[0].ready) return fail(`The database at ${where} has no tables yet. Run "pnpm db:migrate".`);
    const profiles = await client.query("select 1 from profile limit 1");
    if (profiles.rowCount === 0) return fail(`The database at ${where} is empty. Run "pnpm db:seed".`);
    console.log(`✓ Database ready (${where})`);
  } finally {
    await client.end();
  }
}

function fail(message: string) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

check();
