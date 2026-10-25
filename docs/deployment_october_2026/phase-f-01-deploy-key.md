# Phase F, step 1: Deploy key for GitHub Actions

## Why

GitHub Actions needs to log in to the server to run the deploy. It gets its
own SSH key, separate from your personal `shared-web-key`, and the server
lets that key do exactly one thing: run `deploy.sh`.

## The key

| | |
|---|---|
| Type | ED25519 |
| Comment | `github-actions deploy peyyala.com` |
| Fingerprint | `SHA256:d5UPu1hhNECAxSc/IHiVPsvn+aU2gauo1Pr0T+IFkXE` |
| Private half | `C:\Users\J\.ssh\peyyala-github-deploy` (readable by your Windows user only); goes into a GitHub secret in F2 |
| Public half | `C:\Users\J\.ssh\peyyala-github-deploy.pub`; installed on the server |

## On the server

[`scripts/server/f1-deploy-key.sh`](../../scripts/server/f1-deploy-key.sh)
added it to `/home/peyyala/.ssh/authorized_keys` (700/600, owned by
`peyyala`) as:

```
restrict,command="/srv/peyyala/prod/deploy.sh" ssh-ed25519 AAAA… github-actions deploy peyyala.com
```

- `restrict`: no shell, no terminal, no port, agent or X11 forwarding
- `command="…"`: whatever the client asks to run, `deploy.sh` runs instead

A leaked key could only redeploy the project's own `main`. To revoke it,
delete that line (or run the script with a new key; it replaces the old line).

```bash
sudo bash scripts/server/f1-deploy-key.sh peyyala "$(cat peyyala-github-deploy.pub)"
```

## Tested (2026-10-26)

| Test | Result |
|---|---|
| Log in with the key and ask for `cat /srv/peyyala/prod/.env` | nothing from `.env` printed; **`deploy.sh` ran instead**: `✓ Live: 2026-10-26_005320_b3dc58b`, healthy (same commit, so a harmless redeploy) |
| Open a tunnel to the site's port (`-L 13001:127.0.0.1:3001`) | refused: `administratively prohibited` |
| Login works for `peyyala` although its password is locked | yes (key login only) |
| Releases kept afterwards | the newest 3 |

## Status

- [x] Key pair made, private half restricted to your Windows user
- [x] Installed for `peyyala`, limited to `deploy.sh`
- [x] Tested: can deploy, can't read files, can't tunnel
