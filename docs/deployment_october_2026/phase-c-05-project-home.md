# Phase C, step 5: The project's home

## Why

Each project gets its own Linux user, like its own account on a shared
computer. The site runs as user **`peyyala`**: no password, no admin rights,
access only to its own files. If the site ever had a security hole, an
attacker would be stuck inside this account: no other projects, no system
files, no backup key.

| What | Where |
|---|---|
| User `peyyala` | `/home/peyyala` (750), password locked |
| Project folder | `/srv/peyyala/prod` (750): `releases/` (750), `backups/` (700), `deploy.sh` (700), later `.env` (C6) and `current` |
| PM2 for `peyyala`, at boot | systemd service `pm2-peyyala` (enabled) |
| PM2 log rotation | `pm2-logrotate`: daily, 14 kept, compressed, 50 MB cap ([07](07-pm2-config.md)) |
| `deploy.sh` | first copy downloaded from GitHub `main`; each deploy refreshes it ([06](06-deploy-script.md)) |

Working as the project user, from the `ubuntu` login:

```bash
sudo -iu peyyala
```

## How it was done

Script: [`scripts/server/c5-project-home.sh`](../../scripts/server/c5-project-home.sh),
run as root, once per project, safe to run again:

```bash
sudo bash scripts/server/c5-project-home.sh peyyala joshvapeyyala/peyyala
```

Run on `shared-web-1` on 2026-10-25 by Claude over SSH, without errors.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| User | `peyyala` (uid 1001), only in its own group |
| Password | locked (`L`) |
| Admin rights | none |
| Folders | all owned by `peyyala`; `backups/` and `deploy.sh` private to it; the `ubuntu` login can't read them without sudo |
| `deploy.sh` | identical to `scripts/deploy.sh` on `main` (same SHA-256) |
| `pm2-peyyala` | enabled at boot, running |
| `pm2-logrotate` | online; retain 14, compress true, daily at midnight, 50 MB |
| pnpm as `peyyala` (`sudo -iu`, no terminal) | fetched `11.5.2` without a prompt |

## Status

- [x] User `peyyala` (no password, no sudo)
- [x] `/srv/peyyala/prod` with `releases/`, `backups/`
- [x] PM2 at boot and log rotation for `peyyala`
- [x] First copy of `deploy.sh`
