# Phase E, step 1: Fill in the production `.env`

## Why

The site's settings on the server, `/srv/peyyala/prod/.env` (readable only
by user `peyyala`), were started in C6 with everything generated or known.
The values that come from elsewhere were still blank: Google sign-in, the
admin address, the prod bucket key and the Brevo key.

## How it was done (2026-10-25)

A small reusable tool, [`scripts/server/env-set.sh`](../../scripts/server/env-set.sh),
asks for each value, hides what's typed for names containing SECRET, KEY or
PASSWORD, checks each known setting has the right shape (e.g. a Google client
ID, an AWS key ID, a Brevo key), and writes it into the `.env`. Values never
appear on screen, in the shell history or on a command line. Run again to
replace a value.

```powershell
ssh -t -i "$HOME\.ssh\shared-web-key.pem" ubuntu@52.66.16.188 "sudo bash /home/ubuntu/env-set.sh peyyala NAME [NAME...]"
```

Tested first in a throwaway container with fake values, reading them back
with Next.js's own `.env` loader: every value came back exactly (including
`/`, `+`, `<>`, spaces and `$`). Next.js doesn't undo escaped `"` or `\`, so
the tool refuses values containing them; no real key contains them.

- Claude set `MAIL_FROM=Peyyala <notifications@peyyala.com>` (not secret).
- You entered `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAIL`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `BREVO_API_KEY`.

## Checked (2026-10-25), without displaying any value

| Check | Result |
|---|---|
| Every setting filled | yes (`MAIL_TO` blank on purpose: means `ADMIN_EMAIL`) |
| Google client ID and secret vs the laptop's | identical (SHA-256 fingerprints compared) |
| Brevo key vs the laptop's | different: the `peyyala-prod` key |
| S3 key ID vs the laptop's | different: the `joshua-portfolio-prod-app` key |
| Prod bucket with the server's key (as `peyyala`) | upload ok; **public read 200**; listing 403; delete ok; read after delete 403 |
| The prod key on the **dev** bucket | refused |
| Brevo key from the server (`GET /v3/account`, sends nothing) | 200: key valid and the server's address authorized |

The public-read check is the one postponed from Phase B step 7.

## Status

- [x] All blanks filled, each value checked
- [x] Prod bucket: write, public read, delete
- [x] Brevo accepts the key from the server
