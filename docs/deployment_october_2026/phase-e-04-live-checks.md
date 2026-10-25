# Phase E, step 4: Live checks (by Claude)

Run on 2026-10-25, right after the first deploy.

## From the laptop, as a visitor

| Check | Result |
|---|---|
| Pages | `/`, `/work`, `/work/caredeck`, `/services`, `/resume`, `/contact`: 200; missing page: 404; `/admin` → 307 to `/admin/login` |
| HTTPS | TLS 1.3, certificate verified |
| HTTP/3 offered | `Alt-Svc: h3=":443"` |
| `http://` | 308 → `https://`, same path |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Content-Security-Policy` | `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |
| `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` | present, as set in `next.config.ts` |
| Admin pages | `X-Robots-Tag: noindex, nofollow` |
| Optimized image (`/_next/image`) | 200, `image/png` |
| Project link preview (`opengraph-image`) | 200, `image/png` |
| Resume PDF | 200, `application/pdf` |

**Small finding:** responses include `X-Powered-By: Next.js`. Harmless, but
it tells strangers what the site runs. One line in `next.config.ts`
(`poweredByHeader: false`) removes it; suggested for E7.

## On the server

| Check | Result |
|---|---|
| The site's own database connection | 1 connection, `ssl = t`, TLS 1.3 (checked right after a request; idle connections close after ~10 s) |
| Data in `peyyala_prod` | 3 migrations; profile 1, projects 3, jobs 1, roles 2, skill groups 6, education 1, services 3, process steps 4, site settings 1; messages and sign-in tables empty |
| Site errors (`peyyala-prod-error-1.log`) | none |
| Site start | `✓ Ready in 336ms` on `127.0.0.1:3001` |
| Caddy access log | visitors' real addresses recorded (the laptop's, plus the first internet scanners, which is normal for any new site) |
| Backup run by hand | `peyyala/2026-10-25_2349.dump` (32 KB, now with the tables) |
| Memory / disk | 663 MB of 1.9 GB used, swap 10 MB; 20 GB disk free |

PM2's log files are named `peyyala-prod-out-1.log` / `-error-1.log` (the
number is PM2's process id). `pm2 logs peyyala-prod` finds them either way.

## Status

- [x] Pages, HTTPS, redirects, security headers, images, previews, PDF
- [x] Encrypted database connection from the site
- [x] No errors in the site's log
- [x] Backup contains the live data
- [x] `poweredByHeader: false` (done in E7)
