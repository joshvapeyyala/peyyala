# Phase C, step 1: System basics

## Why

The basics every server needs before anything else. Shared by all projects
on `shared-web-1`.

| What | Why |
|---|---|
| Install pending updates | the server image was a few weeks old |
| Automatic security updates | fixes install themselves nightly. **No automatic reboots**: a reboot restarts every site, so it's done by hand when needed |
| Time zone India (IST) | logs, backup times and `date` in local time |
| 4 GB swap file | the server has 2 GB of RAM; builds need more at their peak. `vm.swappiness=10` keeps using RAM first |
| fail2ban | blocks an address for 1 hour after 5 failed SSH logins within 10 minutes |

## How it was done

Script: [`scripts/server/c1-system-basics.sh`](../../scripts/server/c1-system-basics.sh),
run as root. Safe to run again: it only changes what isn't in place.

```bash
sudo bash scripts/server/c1-system-basics.sh
```

Run on `shared-web-1` on 2026-10-25 by Claude over SSH: finished without
errors, no reboot needed.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| Automatic updates | on; service active; automatic reboot **false** |
| Time | `2026-10-25 18:40 IST (Asia/Kolkata)` |
| Swap | 4.0 GiB, in `/etc/fstab` (survives reboots), swappiness 10 |
| fail2ban | active, enabled at boot, `sshd` jail watching the systemd journal |
| Pending updates | 12, all **phased** (systemd, Ubuntu Pro client): Ubuntu releases these to a growing share of servers over a few days. They arrive automatically |

## Day to day

| Task | Command |
|---|---|
| Is a reboot needed? | `ls /var/run/reboot-required` (exists = yes, then `sudo reboot` at a quiet time) |
| Who's banned? | `sudo fail2ban-client status sshd` |
| Unban an address (e.g. your own) | `sudo fail2ban-client set sshd unbanip <ip>` |
| Memory and swap | `free -h` |

If you ever lock yourself out by mistyping (5 failures), wait an hour or
connect from another network.

## Status

- [x] Updates installed, automatic security updates on (no auto reboot)
- [x] Time zone IST
- [x] 4 GB swap, permanent
- [x] fail2ban protecting SSH
