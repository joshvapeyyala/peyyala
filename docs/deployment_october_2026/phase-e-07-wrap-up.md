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

Results: see below.

## Status

- [x] Code changes made and checked locally
- [ ] Committed and pushed (you); `main` updated
- [ ] Deployed; live title shows the tagline; no `X-Powered-By`
