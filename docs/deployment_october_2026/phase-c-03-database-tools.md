# Phase C, step 3: Database tools

## Why

| What | Why |
|---|---|
| `psql` | talk to the database: creating each project's database (C6), checks |
| `pg_dump`, `pg_restore` | copy and restore databases: nightly backups (C7), the copy before each migration ([06](06-deploy-script.md)) |
| Amazon's RDS certificate bundle, `/srv/shared/rds-ca.pem` | lets every site verify it's really talking to RDS (`sslmode=verify-full`, [03](03-database-ssl.md)) |

**The client must match RDS's major version.** `pg_dump` refuses to copy a
newer server, and an older `pg_restore` can't read a newer `pg_dump`'s files.
`shared-db-1` runs **PostgreSQL 18**, so the server has the version 18
client, from the PostgreSQL project's own packages (apt.postgresql.org). No
other client version is installed, so `psql` and `pg_dump` always mean 18.
The laptop's Docker database is also 18, so production backups restore there.

The certificate bundle is Amazon's **global** one (all regions), shared by
every project on the server.

## How it was done

Script: [`scripts/server/c3-database-tools.sh`](../../scripts/server/c3-database-tools.sh),
run as root, safe to run again (it also refreshes the certificate bundle).
`PG_MAJOR` at the top must equal RDS's major version.

```bash
sudo bash scripts/server/c3-database-tools.sh
```

### History (2026-10-25)

1. First run with version **17**, as planned. Checked: verified TLS to RDS
   worked, an unverified connection was refused.
2. The first backup (C7) then failed: `pg_dump: error: aborting because of
   server version mismatch ... server version: 18.3; pg_dump version: 17.11`.
   RDS had been created as **18.3**, not 17 ([phase-b-06](phase-b-06-rds.md)).
   Decision: keep 18 (newer, supported until November 2030).
3. Script changed to 18 (and to remove other client versions), run again:
   `postgresql-client-17` removed, `postgresql-client-18` 18.6 installed.
   The laptop's Docker moved to `postgres:18-alpine` the same day.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| Versions | `psql`, `pg_dump`, `pg_restore`: **18.6** (`18.6-1.pgdg26.04`); only `postgresql-client-18` installed |
| Certificate file | `/srv/shared/rds-ca.pem`, 114 certificates, readable by all users, owned by root |
| Connect to `shared-db-1` with `sslmode=verify-full` and this file (no password) | `fe_sendauth: no password supplied`: encrypted, verified connection made; it only stopped at the login, as expected |
| Same, with only the system's certificates | `SSL error: certificate verify failed`: refused |
| Backup with these tools | works (C7) |

## If RDS is ever upgraded (for example to 19)

Upgrade the server's tools **first** (set `PG_MAJOR` and run the script; a
newer client can still copy an older server), then RDS, then the laptop's
Docker image.

## If Amazon renews its certificates

Amazon announces it well ahead. Run the script again to fetch the new
bundle; nothing else changes.

## Status

- [x] PostgreSQL 18 client tools (matching RDS)
- [x] RDS certificate bundle at `/srv/shared/rds-ca.pem`
- [x] Verified TLS connection to `shared-db-1` works; unverified is refused
