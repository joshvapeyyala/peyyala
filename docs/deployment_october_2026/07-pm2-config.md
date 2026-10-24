# 7. PM2 config

Part of Phase A (code preparation) of the move to AWS.

## Why

PM2 keeps the site running on the server: it starts it at boot, restarts it
if it crashes, keeps its logs, and is what the deploy script restarts after a
deploy. `ecosystem.config.cjs` (in the repo root) is PM2's instructions for
this site.

## What it says

| Setting                         | Value                                  | Why |
| ------------------------------- | -------------------------------------- | --- |
| `name`                          | `peyyala-prod`                         | how you and `deploy.sh` refer to it |
| `cwd`                           | `/srv/peyyala/prod/current`            | always the live release; a restart picks up the new one |
| `script` + `args`               | `next start --port 3001 --hostname 127.0.0.1` | port 3001 is where Caddy sends peyyala.com; `127.0.0.1` means only the server itself (Caddy) can reach it |
| `exec_mode`, `instances`        | `fork`, `1`                            | exactly one copy: Next.js keeps its page cache in memory and an admin save refreshes only the copy that handled it |
| `env`                           | `NODE_ENV=production`                  | |
| `max_memory_restart`            | `1G`                                   | normally ~130–400 MB; above 1 GB something is wrong, so restart instead of slowing the other projects |
| `kill_timeout`                  | `5000`                                 | on stop/restart, 5 seconds for open requests to finish |
| `exp_backoff_restart_delay`     | `200`                                  | crashing repeatedly: wait longer between restarts each time |
| `time`                          | `true`                                 | a timestamp on every log line |

Port 3001 is also set in `scripts/deploy.sh` (`PORT`) and in the Caddy site
(Phase C). Change all three together.

The site's settings (database, S3, Brevo...) are not here: they're in
`/srv/peyyala/prod/.env`, which each release links as `.env.local`.

## Tested (2026-10-25)

In the same server-like container as the deploy script tests:

| Test                                                         | Result |
| ------------------------------------------------------------ | ------ |
| Deploy with this file replacing an older PM2 config          | the normal deploy restart applied every new setting (checked with `pm2 jlist`) |
| Health check via `127.0.0.1:3001`                            | `200` |
| Same port via the server's network address                   | refused: only reachable from the server itself |
| Site process killed (`kill -9`)                              | PM2 restarted it; healthy again within seconds |
| Log lines                                                    | timestamped, e.g. `2026-10-24T22:42:40: ✓ Ready in 178ms` |
| Log rotation (`pm2-logrotate`)                               | installed and configured as below |
| Memory at idle                                               | ~130 MB |

A changed `ecosystem.config.cjs` therefore takes effect with the next deploy;
no manual PM2 steps needed.

## What you do

### Phase C (part of the server setup script, as the `peyyala` user)

1. **Log rotation:** daily files, keep 14, compressed, also rotate any file
   over 50 MB:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:retain 14
   pm2 set pm2-logrotate:compress true
   pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
   pm2 set pm2-logrotate:max_size 50M
   ```
2. **Start at boot:** run `pm2 startup systemd -u peyyala --hp /home/peyyala`.
   It prints one `sudo ...` command: run that as the admin user. Each deploy
   runs `pm2 save`, so PM2 remembers the site.

### Day to day (as `peyyala`: `sudo -iu peyyala`)

| Command                       | Shows                                              |
| ----------------------------- | -------------------------------------------------- |
| `pm2 ls`                      | running apps, uptime, restarts, memory             |
| `pm2 logs peyyala-prod`       | the site's output, live (Ctrl+C to stop watching)  |
| `pm2 logs peyyala-prod --lines 200` | the last 200 lines                           |
| `pm2 describe peyyala-prod`   | everything about the app, log file paths included  |
| `pm2 restart peyyala-prod`    | restart by hand (a few seconds of downtime)        |

Logs are in `/home/peyyala/.pm2/logs/` (`peyyala-prod-out-0.log`,
`peyyala-prod-error-0.log`, plus the rotated, compressed older days).

A rising restart count in `pm2 ls` means the site is crashing or hitting the
memory limit: check `pm2 logs peyyala-prod`.

### Phase E

After the first deploy, reboot the server once (`sudo reboot`) and check the
site comes back by itself: `https://peyyala.com/api/health`.

## Status

- [x] `ecosystem.config.cjs` written
- [x] Tested: settings applied on deploy, local-only port, crash restart,
      timestamps, log rotation
- [ ] Log rotation and start-at-boot on the server (Phase C)
- [ ] Reboot test (Phase E)
