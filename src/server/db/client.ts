// The database connection, shared by every query. Only server code imports
// this (it reads DATABASE_URL); the seed script uses it too, outside Next.js.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");

// One pool per process. In development, hot reloads re-run this module, so the
// pool is kept on globalThis instead of opening a new one on every edit.
const globalForDb = globalThis as unknown as { pgPool?: Pool };
const pool = globalForDb.pgPool ?? new Pool({ connectionString: url, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
export { pool };
