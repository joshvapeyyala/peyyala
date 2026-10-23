// Admin sign-in: Google only, and only for the one account in ADMIN_EMAIL.
//
// Any other Google account is turned away before a user row is created, so
// the auth tables only ever hold the admin. Pages and server actions check
// the session with getAdmin() / requireAdmin(); proxy.ts only does a quick
// cookie check to redirect visitors who are clearly signed out.
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "./db/client";
import * as t from "./db/schema";

// The login page shows a message for this error code
export const notAdminError = "NOT_ADMIN";

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!adminEmail) console.warn("ADMIN_EMAIL is not set, so nobody can sign in to the admin.");

const isAdminEmail = (email: string) => Boolean(adminEmail) && email.trim().toLowerCase() === adminEmail;

function notAdmin() {
  return new APIError("FORBIDDEN", { code: notAdminError, message: "This Google account can't sign in to the admin." });
}

export const auth = betterAuth({
  // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: t.authUsers, session: t.authSessions, account: t.authAccounts, verification: t.authVerifications },
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Always show Google's account picker, so a different account is easy to choose
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // a week
    updateAge: 60 * 60 * 24, // extended at most once a day while in use
  },
  databaseHooks: {
    user: {
      create: {
        // First sign-in: only the admin's verified Google address gets an account
        before: async (user) => {
          if (!user.emailVerified || !isAdminEmail(user.email)) throw notAdmin();
          return { data: user };
        },
      },
    },
    session: {
      create: {
        // Every sign-in: re-checked, in case ADMIN_EMAIL has changed since
        before: async (session) => {
          const [user] = await db.select({ email: t.authUsers.email }).from(t.authUsers).where(eq(t.authUsers.id, session.userId));
          if (!user || !isAdminEmail(user.email)) throw notAdmin();
          return { data: session };
        },
      },
    },
  },
  // Lets sign-in from server actions set cookies; keep it last
  plugins: [nextCookies()],
});

export type Admin = { name: string; email: string };

// The signed-in admin, or null. Reads the request's cookies, so callers sit
// behind a <Suspense> boundary (or run in a server action).
export async function getAdmin(): Promise<Admin | null> {
  // Checking the session compares its expiry with the current time, which is
  // only allowed at request time, never while prerendering (even with cookies)
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) return null;
  return { name: session.user.name, email: session.user.email };
}

// For admin pages and every server action that reads or changes admin data
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
