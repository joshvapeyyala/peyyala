# Phase E, step 7: Wrap-up

## Changes (2026-10-26)

| Change | Where | Why |
|---|---|---|
| "(launching soon)" removed | `README.md` | the site is live |
| `poweredByHeader: false` | `next.config.ts` | responses no longer say `X-Powered-By: Next.js` (E4 finding) |
| Page title follows the profile | `src/app/(site)/layout.tsx`: `generateMetadata()` reading `getProfile()` instead of fixed `metadata` | editing the name or tagline in the admin now also updates the browser tab title and link-preview titles (they were fixed text, see [phase-e-06](phase-e-06-reboot-test.md)) |

`getProfile()` is cached and tagged `profile`, so the title is part of the
prerendered page and refreshes with every profile save, like the page text.

The Brevo key `peyyala-local-test` is kept for future local email tests.

## Checked locally

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| Production build | clean; `/`, `/resume`, `/services`, `/work` still prerendered (○) |
| Title follows the tagline | with a test tagline, the built home page had `<title>Joshva Peyyala — Title Follow Test</title>` and the same `og:title`; other pages keep their own (`Resume — Joshva Peyyala`) |
| `X-Powered-By` | gone |

## Deploy

The first update deploy (not a first deploy): `main` updated, then
`deploy.sh` on the server.

You committed and pushed `dev`; Claude checked it (5 commits, fast-forward,
no key patterns) and moved `main` to `b3dc58b`, then ran `deploy.sh`:

| Step | Result |
|---|---|
| Migrations | 0 pending, so no database copy |
| Build | reused the previous release's cache: compiled in 5.0 s (first deploy: 23.8 s) |
| Health check | `{"ok":true,"commit":"b3dc58b"}` |
| Releases kept | `2026-10-25_233847_f613776`, `2026-10-26_003325_b3dc58b` (rollback target ready) |

Live afterwards:

| Check | Result |
|---|---|
| Home `<title>` and `og:title` | `Joshva Peyyala — Full-stack developer` (the edited tagline) |
| Resume title | `Resume — Joshva Peyyala` |
| `X-Powered-By` | gone |
| `/`, `/work/xpensefy`, `/contact`, `/admin/login` | 200 |
| Site | online, 0 errors logged |

## Status

- [x] Code changes made and checked locally
- [x] Committed and pushed (you); `main` updated to `b3dc58b`
- [x] Deployed; live title shows the tagline; no `X-Powered-By`
- [x] `peyyala-local-test` Brevo key kept
