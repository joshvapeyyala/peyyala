# Phase E, steps 2 and 3: Update `main`, first deploy

## E2: `main` brought up to date (2026-10-25)

Before pushing:

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| Type-check | clean |
| `.env`, `.pem`, credential files tracked in git | none (only `.env.example`) |
| Key patterns (AWS, Brevo, Google, private keys) added in `main..dev` | none real; 2 matches were sentences in the key-pair doc describing a private key |

You committed and pushed the E1 work on `dev`. With your go-ahead, Claude
fast-forwarded GitHub's `main` to `dev`: `0b3925b..f613776`, no merge commit,
no history rewritten. Local `main` updated to match.

## E3: first deploy (2026-10-25)

Run by Claude over SSH, as user `peyyala`, in the background on the server
(log in `/home/peyyala/deploy-first.log`):

```bash
sudo -u peyyala -H bash -lc '/srv/peyyala/prod/deploy.sh'
```

| Step | Result |
|---|---|
| 1 Download `main` | release `2026-10-25_233847_f613776` |
| 4–5 Pending migrations | 3, so a copy of the (empty) database first: `backups/2026-10-25_233904_before_f613776.dump` |
| 6 Migrate | `Applying 3 migrations: 0000_init, 0001_auth, 0002_contact_rate_limit` ✓ |
| 6 Starting content (database was empty) | projects (3), profile, tech strip (10), experience, skills (6), education, services (3), process steps (4), theme |
| 7 Build | database check ✓ (verified TLS to RDS); compiled in 23.8 s; 30 pages prerendered |
| 8 Go live | `current` → the release; PM2 `peyyala-prod` started |
| 9 Health check | `{"ok":true,"commit":"f613776"}` |
| 10 Tidy | ✓ |

Total: about 1 minute 20 seconds (23:38:47 to 23:40:04 IST). The 2 GB
server built without trouble: right after, 1.3 GB memory available, swap
barely used (10 MB).

`✓ Live: 2026-10-25_233847_f613776 (commit f613776)`

### From the laptop, as a visitor

| Address | Status |
|---|---|
| `/`, `/work`, `/work/caredeck`, `/services`, `/resume`, `/contact` | 200 |
| `/api/health` | 200 `{"ok":true,"commit":"f613776"}` |
| `/admin` | 307 → `/admin/login` (not signed in) |
| `/admin/login` | 200 |
| a page that doesn't exist | 404 |

Page title: "Joshva Peyyala — Backend-focused full-stack developer".

PM2: `peyyala-prod` online, 0 restarts, ~146 MB; `pm2-logrotate` online.

## Status

- [x] E2 `main` = `dev` (`f613776`), checked
- [x] E3 first deploy: migrated, starting content loaded, built, live, healthy
