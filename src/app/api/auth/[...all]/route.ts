// Better Auth's endpoints: Google sign-in redirect and callback, session, sign-out
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

export const { GET, POST } = toNextJsHandler(auth);
