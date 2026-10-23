// Better Auth's browser client, for the sign-in and sign-out buttons.
// It talks to /api/auth on the same origin.
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
