# 5. Migrations

Part of Phase A (code preparation) of the move to AWS.

## Why

The database has a fixed shape (tables, columns). When the code needs a new
shape, `pnpm db:generate` writes a migration: a SQL file such as
`src/server/db/migrations/0003_....sql`. Migrating applies the files the
database hasn't had yet; the database keeps a list of applied ones
(`drizzle.__drizzle_migrations`), so each runs exactly once.

On the server, migrating is part of every deploy. `pnpm db:migrate` used to
run `drizzle-kit migrate`, which **fails without saying why** when it can't
connect (found while testing SSL in item 3). On the server that would mean a
failed deploy with no clue.

## What changed

- New script `src/server/db/migrate.ts`. `pnpm db:migrate` now runs it, on
  the laptop and on the server: one way to migrate, and the laptop tests
  exactly what the server does.
- It uses Drizzle's own migrator and the same "already applied" table as
  drizzle-kit, so they're interchangeable and nothing is applied twice.
- It connects like the site (`src/server/db/client.ts`, `DATABASE_URL`), so
  it gets the same SSL settings.
- **All or nothing:** every pending migration runs in one transaction. If
  one fails, none are applied and the database stays as it was.
- **Clear output:** what it applies, or why it failed.
- `pnpm db:migrate --pending` prints only the number of pending migrations.
  The deploy script (item 6) uses it to back up the database first when
  there's anything to apply.

drizzle-kit is still used for making migrations (`pnpm db:generate`) and for
`pnpm db:studio`.

| Command                     | What it does                                  |
| --------------------------- | --------------------------------------------- |
| `pnpm db:generate`          | writes a new migration from `schema.ts`       |
| `pnpm db:migrate`           | applies pending migrations                    |
| `pnpm db:migrate --pending` | prints how many are pending (`0` if none)     |

## Checked on the laptop (2026-10-25)

| Test                                              | Output                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Laptop database                                   | `✓ Database is up to date. No migrations to apply.`                          |
| Fresh empty database                              | `Applying 3 migrations: 0000_init, 0001_auth, 0002_contact_rate_limit` then `✓ Applied 3 migrations.` |
| Same database again                               | `✓ Database is up to date.`                                                  |
| SSL address against the non-SSL Docker database   | `✗ Migration failed, nothing was applied: The server does not support SSL connections` |
| Wrong password                                    | `✗ Migration failed, nothing was applied: password authentication failed for user "peyyala"` |
| A good migration followed by a broken one         | fails naming the broken SQL and `relation "no_such_table" does not exist`; the good one was **not** applied either |

Failures exit with code 1, so the deploy script stops.

## When it runs on the server

Inside the deploy script (item 6), before the build, because the build reads
the database to prerender pages and needs the new shape:

```
fetch code → install → [back up if any pending] → migrate → build → switch → health check
```

## The rule for writing migrations

After migrating, the **old** release keeps serving visitors while the new one
builds (a minute or two). A migration must not break the old code:

| Change                                              | Safe in one deploy?                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Add a table                                         | ✅                                                                    |
| Add a column that allows empty values or has a default | ✅                                                                 |
| Add an index                                        | ✅                                                                    |
| Rename a column or table                            | ❌ Add the new one, copy the data, switch the code; drop the old one in a later deploy |
| Delete a column or table the old code uses          | ❌ Stop using it in one deploy, delete it in the next                 |
| Add a required column with no default               | ❌ Add it with a default (or as optional) first                       |

Also: a rollback (`deploy.sh rollback`) switches the code back but **not**
the database. Following the rule above keeps the older code working.

All existing migrations (0000–0002) follow the rule.

## Safety copy before migrating

RDS takes a full automatic backup every night. To also cover the hours since
then, the deploy script (item 6) saves a copy of the database on the server
before applying migrations, and keeps the last 5. Skipped when
`--pending` says 0. Details in the deploy script's doc.

## Going live (Phase E)

The first deploy applies all migrations to the empty `peyyala_prod`
database (expect `Applying 3 migrations: ...`). Then, once, load the starting
content: `pnpm db:seed`.

## Status

- [x] Migrate script written; `pnpm db:migrate` uses it
- [x] Checked: up to date, fresh database, SSL failure, password failure,
      all-or-nothing on a broken migration
- [x] Backup-before-migrate in the deploy script (item 6), tested
- [x] First migration on RDS (Phase E: 3 applied, [phase-e-03](phase-e-03-first-deploy.md))
