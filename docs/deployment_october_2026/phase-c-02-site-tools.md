# Phase C, step 2: Site tools (Node 22, pnpm, PM2)

## Why

What the sites run and build with. Shared by all projects on `shared-web-1`.

| Tool | Why |
|---|---|
| **Node.js 22** | runs the sites; same major version as the laptop. From NodeSource (the official Node.js packages for Ubuntu), pinned so Ubuntu's own `nodejs` package never replaces it |
| **pnpm** (via corepack) | installs packages. Each project's `package.json` (`packageManager`) picks the exact pnpm version, so the server uses the same one as the laptop |
| **PM2** | keeps each site running ([07](07-pm2-config.md)) |
| **git** | the deploy script downloads `main` with it |

`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` in `/etc/environment`: deploys run
without a terminal, so corepack fetches a project's pnpm version without
asking first.

**Node 22 is supported until April 2027.** Before then, move the laptop and
the server to Node 24 together (change `NODE_MAJOR` in the script and run it
again).

## How it was done

Script: [`scripts/server/c2-site-tools.sh`](../../scripts/server/c2-site-tools.sh),
run as root, safe to run again.

```bash
sudo bash scripts/server/c2-site-tools.sh
```

Run on `shared-web-1` on 2026-10-25 by Claude over SSH, without errors.

## Checked (2026-10-25)

| Check | Result |
|---|---|
| Node | `v22.23.4`, from `deb.nodesource.com/node_22.x` |
| npm, corepack | 10.9.9, 0.36.0 |
| pnpm in a project asking for `pnpm@11.5.2` | `11.5.2`, fetched over a non-interactive SSH session without a prompt |
| PM2 | 6.0.14 (`/usr/bin/pm2`) |
| git | 2.53.0 |

## Status

- [x] Node 22 (NodeSource, pinned)
- [x] pnpm via corepack, no download prompt
- [x] PM2 6
- [x] git
- [ ] Later: Node 24 on laptop and server together (before April 2027)
