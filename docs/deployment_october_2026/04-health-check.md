# 4. Health check

Part of Phase A (code preparation) of the move to AWS.

## Why

A tiny page that answers one question for tools, not people: is the site
working right now? There's no staging, so it is the main safety net:

- **The deploy script (item 6)** calls it after switching to a new release
  and restarting. If it isn't OK, or reports the wrong commit, the script
  switches straight back to the previous release.
- **UptimeRobot (Phase G)** opens it every 5 minutes and emails you when it
  fails.
- **You** can open it any time: `https://peyyala.com/api/health`.

## What it does

`GET /api/health` (`src/app/api/health/route.ts`):

1. Asks the database `select 1` ("are you there?").
2. Answers within 3 seconds: `200 {"ok":true,"commit":"4f1b535"}`
3. Errors or takes longer: `503 {"ok":false,"error":"database","commit":"4f1b535"}`,
   and logs the real error on the server ("Health check: the database didn't
   respond.").

- **Never cached:** it runs on every request (`connection()`), and the answer
  says `Cache-Control: no-store`.
- **Public:** outside `/admin`, no sign-in, so UptimeRobot can reach it. It
  reveals nothing besides ok/not ok and the commit (the repo is public).
- **Light:** one tiny query.

### The commit

`next.config.ts` runs `git rev-parse --short HEAD` when the site is built and
bakes the result into the build as `BUILD_COMMIT`. Each release folder holds
its own build, so after a rollback the health check reports the older
commit, which is correct. Built outside a git checkout, it says `"unknown"`.

The original plan also had Caddy use this. Dropped: Caddy's health checks
choose between several copies of an app, and there's only one.

## Settings

None.

## Checked on the laptop (2026-10-25)

| Situation                       | Answer                                                  |
| ------------------------------- | ------------------------------------------------------- |
| Normal                          | `200 {"ok":true,"commit":"05beb45"}`, `no-store`         |
| Database paused (`docker pause`) | `503 {"ok":false,"error":"database",...}` after 3.06 s |
| Database back                   | `200` again straight away                               |

To repeat the failure test: `docker pause peyyala-db-1`, open
`http://localhost:3000/api/health`, then `docker unpause peyyala-db-1`.

## Going live

1. **Phase E:** after the first deploy, open `https://peyyala.com/api/health`
   and check the commit matches the latest commit on `main`.
2. **Phase G (UptimeRobot, free):**
   1. Sign up at uptimerobot.com.
   2. Add New Monitor: type **HTTP(s)**, name `peyyala.com`, URL
      `https://peyyala.com/api/health`, interval **5 minutes**.
   3. Alert contact: your email.
   4. Optional: keyword monitor for `"ok":true` instead, so a page that loads
      but says not OK also alerts.

## Status

- [x] `/api/health` written: database check, commit, 3-second limit, no caching
- [x] OK and failure answers checked on the laptop
- [x] Not prerendered in a production build: the route list shows
      `/api/health` as dynamic (`ƒ`) (checked during the item 6 tests)
- [x] Checked on peyyala.com after the first deploy: `{"ok":true,"commit":"f613776"}` ([phase-e-03](phase-e-03-first-deploy.md))
- [ ] UptimeRobot monitor set up (Phase G)
