# Phase C, step 8: Final check

## Why

A last pass over the whole server after C1–C7, and a **reboot test**: AWS
restarts servers for maintenance now and then, and everything must come back
by itself.

## Checked (2026-10-25), before and after a reboot

The server was rebooted (`sudo systemctl reboot`) and answered SSH again
about 22 seconds later. Every check gave the same result before and after:

| Area | Check | After the reboot |
|---|---|---|
| C1 | reboot needed | no |
| C1 | automatic security updates | active |
| C1 | time zone | Asia/Kolkata |
| C1 | swap | `/swapfile` 4G |
| C1 | fail2ban `sshd` jail | active |
| C2/C3 | node / pm2 | v22.23.4 / 6.0.14 |
| C3 | psql / pg_dump | 18.6 / 18.6 |
| C7 | aws | 2.38.5 |
| C3 | RDS certificate bundle | 114 certificates |
| C4 | caddy | active, enabled at boot |
| C4 | `https://peyyala.com` (server and laptop) | "This site will be back soon" (502 until the first deploy); valid certificate; `www` → 301 to `peyyala.com` |
| C5 | user `peyyala` | password locked |
| C5 | `pm2-peyyala` | active, enabled at boot; `pm2-logrotate` online |
| C5 | `deploy.sh` | `-rwx------ peyyala` |
| C6 | `.env` | `-rw------- peyyala` |
| C6 | `peyyala_prod` connection | `peyyala_prod t TLSv1.3` |
| C7 | backup timer | active, next Mon 2026-10-26 02:30 IST; last run success |
| | memory | 482 MiB used, 1.4 GiB available |
| | disk `/` | 7.1 GB used, 21 GB free |
| | failed systemd units | 0 |

Two of my check commands had quoting mistakes on the first pass (shown as a
blank and an SQL error); fixed and re-run, both fine. Not server problems.

Temporary files from the setup (copies of the step scripts, logs) were
removed from the `ubuntu` home folder and `/tmp`.

## Re-running the check

The checks above are quick to repeat (as `ubuntu`): `systemctl --failed`,
`systemctl list-timers backup-databases.timer`, `free -h`, `df -h /`, and
`curl -I https://peyyala.com`.

## Status

- [x] All C1–C7 checks pass
- [x] Survives a reboot without anything done by hand
- [x] Setup leftovers removed

**Phase C is complete.** The server is ready for the first deploy (Phase E).
