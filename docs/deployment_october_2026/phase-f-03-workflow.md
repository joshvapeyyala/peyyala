# Phase F, step 3: The deploy workflow

## What it does

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs
on every push to `main`, or by hand (GitHub > Actions > Deploy > Run
workflow):

```
check  (GitHub's machine)          deploy  (only if check passed)
  pnpm install --frozen-lockfile     load the deploy key and the server's host key (secrets)
  pnpm lint                          ssh peyyala@server → deploy.sh (the only thing the key may run)
  next typegen                       check https://peyyala.com/api/health from outside
  tsc --noEmit                       remove the key
```

- **A failing check stops it:** nothing reaches the server, the site stays as it is.
- **The build runs on the server**, the only place that can reach the
  database. `deploy.sh` builds before switching, and switches back by itself
  if the new release fails its health check. Its exit code becomes the
  workflow's, so a failed deploy shows ❌ on GitHub (and GitHub emails you).
- **One at a time:** pushes in quick succession queue (`concurrency:
  deploy-production`, not cancelled halfway). The server's lock is a second
  safety.
- **Host key checked** (`StrictHostKeyChecking=yes` with `DEPLOY_KNOWN_HOSTS`):
  it only talks to your server.
- **Minimal permissions:** the workflow token can only read the repo.
- **`next typegen`:** creates the route types (`PageProps`, `RouteContext`, …)
  that `next build` would make, so the type-check works without a build.
- Cost: free (public repository).

## Checked locally (2026-10-26)

| Check | Result |
|---|---|
| `actionlint` 1.7.7 (workflow syntax, expressions, and shellcheck of every `run:` step) | no problems |
| The check job in a Linux container (Node 22), on a fresh clone of `dev` | install ✓, lint ✓ (0 errors, 1 warning), typegen ✓, `tsc --noEmit` ✓ |

The warning is old and harmless: an `eslint-disable` comment in
`src/app/(site)/work/[slug]/opengraph-image.tsx` (line 61) that's no longer
needed. Warnings don't fail the check.

The deploy job needs the secrets and the server, so it's first tested for
real in F5.

## Your workflow from now on

1. Work and commit on `dev`, push.
2. When ready to go live: bring `main` up to `dev` and push `main` (or ask
   Claude to). That push starts the workflow.
3. GitHub > **Actions** shows the run live; ✅ means it's on peyyala.com.

Rollback stays a deliberate step on the server:
`sudo -iu peyyala` then `/srv/peyyala/prod/deploy.sh rollback`.

## Status

- [x] Workflow written, actionlint clean
- [x] Check job passes on a fresh clone
- [ ] Committed and pushed (you)
- [ ] First real run (F5)
