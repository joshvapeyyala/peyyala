# Phase C, step 3: Database tools

## Why

| What | Why |
|---|---|
| `psql` | talk to the database: creating each project's database (C6), checks |
| `pg_dump`, `pg_restore` | copy and restore databases: nightly backups (C7), the copy before each migration ([06](06-deploy-script.md)) |
| Amazon's RDS certificate bundle, `/srv/shared/rds-ca.pem` | lets every site verify it's really talking to RDS (`sslmode=verify-full`, [03](03-database-ssl.md)) |

**Version 17, from the PostgreSQL project's own packages
(apt.postgresql.org).** Ubuntu 26.04's own client is version 18. It could
copy a 17 database, but its backup files can't be read by Postgres 17's
`pg_restore` (the laptop's Docker). Matching RDS's version keeps every backup
restorable on both.

The certificate bundle is Amazon's **global** one (all regions), shared by
every project on the server.

## How it was done

Script: [`scripts/server/c3-database-tools.sh`](../../scripts/server/c3-database-tools.sh),
run as root, safe to run again (it also refreshes the certificate bundle).

```bash
sudo bash scripts/server/c3-database-tools.sh
```

Run on `shared-web-1` on 2026-10-25 by Claude over SSH, without errors.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| Versions | `psql`, `pg_dump`, `pg_restore`: **17.11** (`17.11-1.pgdg26.04`) |
| Certificate file | `/srv/shared/rds-ca.pem`, 114 certificates, readable by all users, owned by root |
| Connect to `shared-db-1` with `sslmode=verify-full` and this file (no password given) | `fe_sendauth: no password supplied`: the encrypted, verified connection was made; it only stopped at the login, as expected |
| Same, with only the system's certificates | `SSL error: certificate verify failed`: refused, so the check is really happening |

## If Amazon renews its certificates

Amazon announces it well ahead. Run the script again to fetch the new bundle;
nothing else changes.

## Status

- [x] PostgreSQL 17 client tools
- [x] RDS certificate bundle at `/srv/shared/rds-ca.pem`
- [x] Verified TLS connection to `shared-db-1` works; unverified is refused
