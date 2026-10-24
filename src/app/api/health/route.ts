// Whether the site works right now: the app answers and the database
// responds. For the deploy script (rolls back if this fails after a restart)
// and uptime monitoring. Public, so it says nothing beyond ok and the commit.
import { connection } from "next/server";
import { pool } from "@/server/db/client";

// Longer than this and the database counts as down
const timeoutMs = 3000;

export async function GET() {
  // Checked on every request, never prerendered or cached
  await connection();
  const commit = process.env.BUILD_COMMIT ?? "unknown";
  try {
    await Promise.race([
      pool.query("select 1"),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`no answer in ${timeoutMs} ms`)), timeoutMs)),
    ]);
    return Response.json({ ok: true, commit }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check: the database didn't respond.", error);
    return Response.json({ ok: false, error: "database", commit }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
