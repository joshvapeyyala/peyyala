# Phase E, step 6: Reboot test with the site running

## Result (2026-10-26, about 00:00 IST)

`sudo systemctl reboot`, timed from the laptop by polling
`https://peyyala.com/api/health`:

- unreachable from about 6 s after the command
- back, healthy, about **25 s** after the command (`{"ok":true,"commit":"f613776"}`)

After the reboot:

| Check | Result |
|---|---|
| `pm2-peyyala`, site `peyyala-prod` | active; online; 0 restarts |
| `pm2-logrotate` | online |
| Caddy, backup timer, fail2ban, automatic updates | all active; next backup 02:30 |
| Swap | 4 GB |
| Failed services | 0 |
| Site errors since boot | 0 |
| Pages from the laptop | 200 |
| Memory | 521 MB used, 1.38 GB available |
| Admin edit from E5 (tagline "Full-stack developer") | still shown in the page text: "I'm Joshva Peyyala, a full-stack developer" |

Everything came back by itself, including the content edited in the admin
before the reboot.

## A false alarm, for the record

Right after the reboot, Claude reported that the tagline edit had fallen
back to the build's content, investigated, and proposed (and briefly made,
locally) a cache-timing change. That was a misreading:

- The home page's **title** and link-preview titles,
  "Joshva Peyyala — Backend-focused full-stack developer", are fixed text in
  `src/app/(site)/layout.tsx` (`metadata`), not the profile's tagline.
- The **tagline** appears in the page text, lowercased: "…a full-stack
  developer". The checks had only looked at the first match, the title.

Checked properly, the live page showed the edited tagline after the reboot,
matching the database. The cache change was reverted before being committed
or deployed; the code is as it was.

Side note: because the title is fixed text, editing the tagline in the admin
doesn't change the browser tab title or link-preview titles. If that should
follow the tagline, `layout.tsx` would need `generateMetadata()` reading
`getProfile()` instead of the fixed `metadata` (optional).

## Status

- [x] Server and site come back by themselves after a reboot (~25 s)
- [x] Admin edits survive the restart
