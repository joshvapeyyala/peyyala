# 6. Deploy script

Part of Phase A (code preparation) of the move to AWS.

## Why

One command that puts the latest `main` live on peyyala.com safely, and one
that goes back. There's no staging, so the script has to protect the live
site itself. In Phase F, GitHub Actions runs it on every push to `main`; it
can also be run by hand on the server.

```
/srv/peyyala/prod/deploy.sh            deploy the latest main
/srv/peyyala/prod/deploy.sh rollback   go back to the previous release
```

## How the server keeps versions

```
/srv/peyyala/prod/
  ├─ .env              secrets, one place, never inside a release (chmod 600)
  ├─ deploy.sh         the server's copy of scripts/deploy.sh (updates itself)
  ├─ releases/
  │   ├─ 2026-11-02_153012_a1b2c3d/
  │   ├─ 2026-11-05_091044_e4f5a6b/
  │   └─ 2026-11-07_182001_c7d8e9f/   newest
  ├─ current -> releases/2026-11-07_182001_c7d8e9f    what PM2 runs
  └─ backups/          database copies from before migrations (chmod 700)
```

Going live and rolling back only move the `current` signpost and restart.

## What a deploy does

| #  | Step                                                                 | If it fails                                     |
| -- | -------------------------------------------------------------------- | ----------------------------------------------- |
| –  | Lock: one deploy or rollback at a time                               | "Another deploy or rollback is running"         |
| 1  | Download `main` into a new release folder                            | stops, site untouched                           |
| 2  | `pnpm install --frozen-lockfile`                                     | stops, site untouched, release deleted          |
| 3  | Link `/srv/peyyala/prod/.env` as the release's `.env.local`          | stops, site untouched, release deleted          |
| 4  | Count pending migrations (`pnpm db:migrate --pending`)               | stops, site untouched, release deleted          |
| 5  | If any: save a copy of the database (`pg_dump`), keep the newest 5   | stops, site untouched, release deleted          |
| 6  | Migrate (all or nothing). First deploy only: load the starting content if the database is empty | stops, site untouched, release deleted |
| 7  | Build, reusing the previous release's build cache                    | stops, site untouched, release deleted          |
| 8  | Point `current` at the new release, restart the app (PM2)            | –                                               |
| 9  | Health check: `/api/health` OK **and** reporting the new commit, within 60 s | switches back to the previous release, restarts, deletes the new one |
| 10 | Keep the newest 3 releases; update the server's copy of `deploy.sh`  | –                                               |

Until step 8, visitors see the old release. A rollback can't undo migrations,
which is why migrations follow the rule in `05-migrations.md` and why step 5
takes a copy.

**First deploy:** the database starts empty. Step 6 applies all migrations
and then runs `pnpm db:seed`, because the build needs content to prerender.
It only seeds when the `profile` table is empty, so it never touches real
content.

**Rollback** (`deploy.sh rollback`): points `current` at the release just
older than the live one, restarts, and checks health. Run it again to go
further back (up to the 3 kept releases). The database stays as it is.

**Downtime:** about 2–5 seconds during the restart in step 8. Accepted: a
visitor loading a page in that moment gets an error and a reload fixes it.

## Settings

At the top of `scripts/deploy.sh`. For another project, copy the file and
change these:

| Setting         | Value                                            |
| --------------- | ------------------------------------------------ |
| `APP`           | `peyyala-prod` (the PM2 process name)            |
| `BASE`          | `/srv/peyyala/prod`                              |
| `REPO`          | `https://github.com/joshvapeyyala/peyyala.git` (public, so no key needed) |
| `BRANCH`        | `main`                                           |
| `PORT`          | `3001` (must match `ecosystem.config.cjs`)       |
| `KEEP_RELEASES` | `3`                                              |
| `KEEP_BACKUPS`  | `5`                                              |
| `HEALTH_WAIT`   | `60` seconds                                     |

`DEPLOY_BASE`, `DEPLOY_REPO`, `DEPLOY_BRANCH` and `DEPLOY_PORT` override them
for testing.

`.gitattributes` keeps `.sh` files with Linux line endings, even when edited
on Windows.

## Tested (2026-10-25)

In a Docker container set up like the server (Node 22, pnpm via corepack,
PM2 6, PostgreSQL 17 client, as planned at the time), deploying a snapshot of the working tree on a
`main` branch, against a scratch database:

| # | Test                                                | Result |
| - | --------------------------------------------------- | ------ |
| 1 | First deploy, empty database                         | copy saved, 3 migrations applied, content seeded, built, live, healthy |
| 2 | Second deploy, no migrations                         | no copy, build cache reused (compile 12 s → 7 s), new commit live, server copy of `deploy.sh` updated; 32 s in total |
| 3 | Commit with a type error                             | stopped at build, one clear message, release deleted, old release still live |
| 4 | Commit that builds but fails its health check        | went live, failed health check, **switched back by itself**, old release healthy |
| 5 | Commit with a new migration                          | copy saved (private, all tables), migration applied, live |
| 6 | Rollback, twice, then once more                      | stepped back one release each time, healthy; then "no release older than ..." |
| 7 | Fourth release                                       | only the newest 3 kept |
| 8 | Second deploy started while one runs                 | "Another deploy or rollback is running" |
| 9 | Restore the copy from test 5 into a new database     | restored: the database as it was before the migration |

The older release ran fine on the database after the new migration, which
shows the migration rule working. `shellcheck` reports no issues.

## What you do

### Before the first deploy

1. **Rename `master` to `main`** (the script deploys `main`). Steps come with
   Phase F; the first manual deploy needs it too.
2. **Phase C** (part of the server setup script):
   - PostgreSQL client tools (`pg_dump`, `psql`) in the **same major version
     as RDS** (18; done in [phase-c-03](phase-c-03-database-tools.md)). pg_dump
     refuses a newer server, so they come from
     PostgreSQL's own package repository:
     ```bash
     sudo apt install -y postgresql-common
     sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
     sudo apt install -y postgresql-client-18
     ```
   - Node 22, `corepack enable`, PM2, git, curl.
   - The folder `/srv/peyyala/prod`, owned by the `peyyala` user.
   - The server's first copy of the script:
     ```bash
     sudo -u peyyala curl -fsSL -o /srv/peyyala/prod/deploy.sh \
       https://raw.githubusercontent.com/joshvapeyyala/peyyala/main/scripts/deploy.sh
     sudo chmod 700 /srv/peyyala/prod/deploy.sh
     ```
3. **Phase E:** create `/srv/peyyala/prod/.env` with the production values
   from items 1–3 (`chmod 600`, owned by `peyyala`).

### Deploying by hand

```bash
sudo -iu peyyala
/srv/peyyala/prod/deploy.sh
```

Each step prints a `==>` line, and it ends with `✓ Live: <release> (commit <id>)`
or a `✗` line saying what failed.

### Restoring a database copy

Only if a migration went wrong. This replaces the live database's contents
with the copy:

```bash
sudo -iu peyyala
ls -lt /srv/peyyala/prod/backups/
pm2 stop peyyala-prod
pg_restore --clean --if-exists --no-owner \
  --dbname="$(grep ^DATABASE_URL= /srv/peyyala/prod/.env | cut -d= -f2- | tr -d \"\')" \
  /srv/peyyala/prod/backups/<file>.dump
/srv/peyyala/prod/deploy.sh rollback    # code from before that migration
```

Test this once on a scratch database before relying on it (Phase G).

## Status

- [x] Script written; `shellcheck` clean
- [x] All 9 tests above passed in a server-like container
- [x] `.gitattributes` keeps it with Linux line endings
- [x] `/api/health` confirmed dynamic in a production build (route list `ƒ`)
- [ ] `master` renamed to `main`
- [ ] Server prepared (Phase C), first real deploy (Phase E)
- [ ] GitHub Actions runs it on push to `main` (Phase F)
