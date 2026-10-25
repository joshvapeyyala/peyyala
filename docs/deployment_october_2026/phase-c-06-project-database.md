# Phase C, step 6: The site's database and settings file

## Why

`shared-db-1` is the building; this step makes the site's flat and key:

| What | Details |
|---|---|
| Database `peyyala_prod` | the live site's content, messages and sign-ins |
| Login `peyyala_prod` | owns its database and can open **only** that one; not an admin |
| Its password | generated on the server (48 hex characters) and written straight into the `.env`: nobody typed, saw or copied it |
| `/srv/peyyala/prod/.env` | the production settings, readable only by user `peyyala` |

The RDS master password (`shared_admin`) was typed once at a hidden prompt,
used to create the above, and not stored.

## How it was done

Script: [`scripts/server/c6-project-database.sh`](../../scripts/server/c6-project-database.sh),
run as root, once per project. Safe to run again: if the `.env`'s login
already works it does nothing (without asking for the password); otherwise it
sets a new login password and updates only `DATABASE_URL`.

```powershell
ssh -t -i "$HOME\.ssh\shared-web-key.pem" ubuntu@52.66.16.188 "sudo bash <path>/c6-project-database.sh peyyala shared-db-1.c1kuqgqk49fk.ap-south-1.rds.amazonaws.com peyyala.com"
```

`-t` lets the script ask for the master password. The SQL, passwords
included, goes to `psql` on standard input, never on the command line (where
other processes could see it).

What it does in the database:

- creates the login, sets its password
- makes `shared_admin` a member of it (required to create a database it owns)
- creates `peyyala_prod` owned by `peyyala_prod`
- removes everyone else's access to it, and stops project logins opening the
  default `postgres` database

### Rehearsed first (2026-10-25)

On the laptop's Docker Postgres, with a non-superuser admin like RDS's and
throwaway names (all removed afterwards): created correctly, a second run
harmless, and two projects created this way **can't open each other's
databases** ("permission denied ... User does not have CONNECT privilege").

### Run on RDS (2026-10-25)

You ran the command and typed the master password. Output:
`connected as peyyala_prod to peyyala_prod, ssl=true TLSv1.3`.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| `.env` | `-rw------- peyyala:peyyala`; the `ubuntu` login can't read it without sudo |
| `DATABASE_URL` | `postgres://peyyala_prod:<hidden>@shared-db-1...:5432/peyyala_prod?sslmode=verify-full&sslrootcert=/srv/shared/rds-ca.pem` |
| Own database | connects; owner `peyyala_prod`; can create tables |
| `postgres` database | refused: "User does not have CONNECT privilege" |
| Admin rights | none (not superuser, can't create databases or logins) |
| Leaks | the password isn't in the shell history or any file in `/tmp` or the home folder |
| Second run | "Already set up ... Nothing to do", no password asked |

### The `.env` now

| Setting | Now |
|---|---|
| `DATABASE_URL` | set (generated) |
| `BETTER_AUTH_SECRET` | set (generated, different from the laptop's) |
| `BETTER_AUTH_URL` | `https://peyyala.com` |
| `S3_BUCKET`, `S3_REGION`, `STORAGE_PUBLIC_URL` | `joshua-portfolio-prod`, `ap-south-1`, its address |
| `MAIL_DRIVER`, `TRUSTED_PROXIES` | `brevo`, `1` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL` | **blank: Phase E** |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | **blank: Phase E** (the `joshua-portfolio-prod-app` key) |
| `MAIL_FROM`, `BREVO_API_KEY` | **blank: Phase D/E** |
| `MAIL_TO` | blank on purpose (means `ADMIN_EMAIL`) |

Editing it later: `sudo -iu peyyala`, then `nano /srv/peyyala/prod/.env`.

## Tidying done in this step

My checks had started idle PM2 processes for the `ubuntu` and `root`
logins (running `pm2` starts one for whoever runs it). Stopped and removed;
only `peyyala`'s PM2 runs. `c2-site-tools.sh` and `c5-project-home.sh` no
longer leave one behind. Temporary script copies on the server removed.

## Status

- [x] Database and login `peyyala_prod`, isolated, verified TLS
- [x] `.env` started, private to `peyyala`
- [x] `.env` blanks filled in ([phase-e-01](phase-e-01-env.md))
