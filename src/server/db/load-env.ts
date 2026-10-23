// For scripts run outside Next.js (pnpm db:seed): load .env.local and friends
// the way Next.js does. Imported first, before anything reads process.env.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
