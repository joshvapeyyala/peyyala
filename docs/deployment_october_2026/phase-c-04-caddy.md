# Phase C, step 4: Caddy and DNS

## Why

Caddy is the front door of `shared-web-1`. For each site it:

- gets an HTTPS certificate from Let's Encrypt and renews it by itself
- redirects `http://` to `https://`, and `www.<domain>` to `<domain>`
- passes visitors to the site's port inside the server (peyyala: `127.0.0.1:3001`)
- shows a short "This site will be back soon" page while the site isn't
  running (before the first deploy, during a restart, or if it's down),
  instead of an error. It answers with status 502, so uptime monitoring still
  sees the site as down. Once the site runs, visitors get it automatically.

## DNS (Cloudflare, done 2026-10-25)

| Type  | Name  | Content         | Proxy |
|-------|-------|-----------------|-------|
| A     | `@`   | `52.66.16.188`  | DNS only (grey) |
| CNAME | `www` | `peyyala.com`   | DNS only (grey) |

The zone was empty before. Grey cloud: visitors reach the server directly
(no Cloudflare proxy), so `TRUSTED_PROXIES=1` (Caddy only) stays right.
Checked through Cloudflare's and Google's resolvers: both names resolve to
`52.66.16.188`, no IPv6 record.

The page's warnings about receiving email are expected: the site only sends
mail. SPF, DKIM and DMARC come with the Brevo setup (Phase D).

## How it was done

Script: [`scripts/server/c4-caddy.sh`](../../scripts/server/c4-caddy.sh),
run as root, safe to run again, and once per project:

```bash
sudo bash scripts/server/c4-caddy.sh peyyala peyyala.com 3001
```

| File on the server | What |
|---|---|
| `/etc/caddy/Caddyfile` | loads every file in `/etc/caddy/sites/` |
| `/etc/caddy/sites/peyyala.caddy` | the peyyala.com and www.peyyala.com sites |
| `/srv/shared/back-soon/index.html` | the "back soon" page, shared by all sites |
| `/var/log/caddy/peyyala.log` | visits to peyyala.com, rolled at 20 MB, 10 kept |

Caddy v2.11.7 from Caddy's official packages.

**Problem found and fixed:** the first run checked the config as root, which
created the site's log file owned by root; the Caddy service (user `caddy`)
then couldn't open it and the reload failed (`permission denied`). The
script now checks the config as the `caddy` user and fixes the log folder's
owner first.

## Checked from the laptop (2026-10-25)

| Request | Result |
|---|---|
| `https://peyyala.com/` | "This site will be back soon" page (502, `no-store`): site not deployed yet |
| Certificate | `CN=peyyala.com`, issued by Let's Encrypt, valid until 23 January 2027 (renewed automatically about a month before) |
| `http://peyyala.com/work?x=1` | 308 → `https://peyyala.com/work?x=1` |
| `https://www.peyyala.com/resume` | 301 → `https://peyyala.com/resume` |
| `http://www.peyyala.com/` | 308 → `https://www.peyyala.com/` (then 301 to peyyala.com) |

## Day to day

| Task | Command |
|---|---|
| Is Caddy running? | `systemctl status caddy` |
| Caddy's own log (certificates, errors) | `sudo journalctl -u caddy -n 50` |
| Visits to the site | `sudo tail -f /var/log/caddy/peyyala.log` |
| After editing a site file | `sudo -u caddy caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy` |

## Status

- [x] DNS records in Cloudflare (grey cloud)
- [x] Caddy installed, peyyala.com site configured
- [x] HTTPS certificate issued; redirects work
- [x] "Back soon" page until the site is deployed
