# Deploying peyyala.com to AWS (October 2026)

The starting point for the move to AWS. Each Phase A item has its own doc
(why, what changed, tests, what to do). This page ties them together: the
picture, the production settings in one place, what's left to do and the
everyday commands.

## The setup

```
                     Cloudflare DNS (grey cloud: DNS only)
                     peyyala.com · www.peyyala.com · other projects
                                     │
                                     ▼
┌──────────── EC2 "shared-web-1" (Mumbai, Ubuntu 24.04, t3a.medium) ────────────┐
│  Caddy: HTTPS for every domain                                                │
│    peyyala.com      → 127.0.0.1:3001  PM2 "peyyala-prod" (one process)        │
│    www.peyyala.com  → redirect to peyyala.com                                 │
│    other projects   → their own ports and PM2 apps                            │
│  /srv/peyyala/prod: releases/, current, .env, backups/, deploy.sh             │
└──────┬─────────────────────────────┬──────────────────────────────────────────┘
       │ private network, TLS        │ HTTPS
       ▼                             ▼
RDS "shared-db-1" (Postgres 18)   S3                              Brevo
  peyyala_prod (own login)          joshua-portfolio-prod (live)   notification
  other projects' databases         joshua-portfolio-dev (laptop)  emails
                                    joshua-peyyala-db-backups (nightly)
```

| | Laptop | Live |
|---|---|---|
| Address | `localhost:3000` | `https://peyyala.com` |
| Database | Docker | RDS `peyyala_prod` |
| Uploads | `joshua-portfolio-dev` | `joshua-portfolio-prod` |
| Email | printed in the terminal | Brevo |
| Deployed from | not deployed | `main` |

## Phase A: code preparation

| # | Item | Doc | Status |
|---|------|-----|--------|
| 1 | Brevo email driver | [01-brevo-email.md](01-brevo-email.md) | done; real test email pending Brevo setup |
| 2 | S3 storage driver | [02-s3-storage.md](02-s3-storage.md) | done, tested on the dev bucket |
| 3 | Encrypted database connection | [03-database-ssl.md](03-database-ssl.md) | done, tested locally |
| 4 | Health check `/api/health` | [04-health-check.md](04-health-check.md) | done, tested |
| 5 | Migrations (`pnpm db:migrate`) | [05-migrations.md](05-migrations.md) | done, tested |
| 6 | Deploy script | [06-deploy-script.md](06-deploy-script.md) | done, tested in a server-like container |
| 7 | PM2 config | [07-pm2-config.md](07-pm2-config.md) | done, tested in a server-like container |
| 8 | Documentation | this page and the root `README.md` | done |

Also changed along the way: Resend removed, the local uploads folder and the
automated tests removed (tests to be rewritten), `.gitattributes` added.

## The production `.env`

`/srv/peyyala/prod/.env` on the server, owned by `peyyala`, `chmod 600`.
Never committed, never on the laptop.

| Setting | Value | Where it comes from |
|---|---|---|
| `DATABASE_URL` | `postgres://peyyala_prod:<password>@<rds-endpoint>:5432/peyyala_prod?sslmode=verify-full&sslrootcert=/srv/shared/rds-ca.pem` | Phase C, when the database and login are created. Password of letters and digits only. [03](03-database-ssl.md) |
| `BETTER_AUTH_SECRET` | a **new** random string, not the laptop's | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `BETTER_AUTH_URL` | `https://peyyala.com` | |
| `GOOGLE_CLIENT_ID` | same OAuth client as the laptop | Google Cloud Console (Phase D adds the live addresses) |
| `GOOGLE_CLIENT_SECRET` | same OAuth client as the laptop | Google Cloud Console |
| `ADMIN_EMAIL` | your Google address | |
| `S3_BUCKET` | `joshua-portfolio-prod` | [02](02-s3-storage.md) |
| `S3_REGION` | `ap-south-1` | |
| `S3_ACCESS_KEY_ID` | key of `joshua-portfolio-prod-app` | Phase B, IAM |
| `S3_SECRET_ACCESS_KEY` | secret of `joshua-portfolio-prod-app` | Phase B, IAM |
| `STORAGE_PUBLIC_URL` | `https://joshua-portfolio-prod.s3.ap-south-1.amazonaws.com` | |
| `MAIL_DRIVER` | `brevo` | [01](01-brevo-email.md) |
| `MAIL_TO` | empty (means `ADMIN_EMAIL`) | |
| `MAIL_FROM` | `Peyyala <notifications@peyyala.com>` | Phase D, Brevo sender |
| `BREVO_API_KEY` | the `peyyala-prod` key | Phase D, Brevo |
| `TRUSTED_PROXIES` | `1` (Caddy) | Becomes `2` if Cloudflare's proxy (orange cloud) is ever switched on |

`NODE_ENV` and the port come from `ecosystem.config.cjs`, not the `.env`.

## What's left for you

### Before the first deploy
- [x] Merge `dev` into `main` and push (2026-10-25). Keep `main` up to date
      with what should be live: the server deploys `main`.

### Phase B: AWS foundation (done 2026-10-25, except the items still open below)
- [x] Account secured: MFA on root, admin user `joshva-admin` with MFA ([phase-b-00](phase-b-00-secure-account.md))
- [x] Budget alert exists at $25; raise it later to fit the setup ([phase-b-01](phase-b-01-budget.md))
- [x] Key pair `shared-web-key`, kept safe on the laptop and backed up ([phase-b-02](phase-b-02-key-pair.md))
- [x] Security groups `shared-web-sg` (80, 443 open; 22 key-only) and `shared-db-sg` (5432 from `shared-web-sg` only) ([phase-b-03](phase-b-03-security-groups.md))
- [ ] **Free plan:** note the credits' expiry and upgrade to the paid plan before the plan ends, or AWS closes the account ([phase-b-04](phase-b-04-ec2.md))
- [x] EC2 `shared-web-1`: Ubuntu 26.04 LTS, `t3.small` (Free plan), 30 GB gp3 encrypted, Standard CPU credits, IMDSv2 required ([phase-b-04](phase-b-04-ec2.md))
- [x] Elastic IP `52.66.16.188` attached to `shared-web-1`, SSH login works ([phase-b-05](phase-b-05-elastic-ip.md))
- [x] RDS `shared-db-1`: PostgreSQL 18.3 (17 was planned; 18 kept, see [phase-b-06](phase-b-06-rds.md)), db.t4g.micro, 20 GB gp3, zone ap-south-1b, private, encrypted, backups 1 day (7 after the plan upgrade), deletion protection. Reachable from the server only, TLS verified. Leave `rds.force_ssl` on ([phase-b-06](phase-b-06-rds.md), [03](03-database-ssl.md))
- [x] S3 `joshua-portfolio-prod` + IAM user `joshua-portfolio-prod-app` + its key ([phase-b-07](phase-b-07-prod-bucket.md)); public-read test in Phase E
- [x] S3 `joshua-peyyala-db-backups` (private, versioned, 30-day delete rule) + write-only IAM user `shared-backup` ([phase-b-08](phase-b-08-backups-bucket.md))

### Phase C: server setup (done 2026-10-25; step by step, scripts in `scripts/server/`)
- [x] C1 System basics: updates, automatic security updates, IST, 4 GB swap, fail2ban ([phase-c-01](phase-c-01-system-basics.md))
- [x] C2 Site tools: Node 22, pnpm, PM2 ([phase-c-02](phase-c-02-site-tools.md))
- [x] C3 Database tools: PostgreSQL 18 client (matches RDS), RDS certificate ([phase-c-03](phase-c-03-database-tools.md))
- [x] C4 Caddy + DNS records in Cloudflare: HTTPS live, "back soon" page until deploy ([phase-c-04](phase-c-04-caddy.md))
- [x] C5 Project home: user `peyyala`, folders, PM2 at boot + log rotation, `deploy.sh` ([phase-c-05](phase-c-05-project-home.md))
- [x] C6 Database `peyyala_prod` + login (isolated, TLS verified), `.env` started ([phase-c-06](phase-c-06-project-database.md))
- [x] C7 Nightly backups to S3 at 02:30, healthchecks.io alerts ([phase-c-07](phase-c-07-backups.md))
- [x] C8 Final check, including a reboot test ([phase-c-08](phase-c-08-final-check.md))

Originally planned as one script, covering:
Covers: updates, swap, fail2ban, Node 22, pnpm, PM2, Caddy, **PostgreSQL 18
client tools** ([06](06-deploy-script.md)), the `peyyala` user and folders,
RDS certificate ([03](03-database-ssl.md)), databases and logins, nightly
backups, the Caddy site, PM2 log rotation and start-at-boot
([07](07-pm2-config.md)), and the first copy of `deploy.sh`.

### Phase D: domain, email, sign-in (done 2026-10-25)
- [x] peyyala.com bought at Cloudflare
- [x] Cloudflare DNS (grey cloud): `peyyala.com` A → `52.66.16.188`, `www` CNAME → `peyyala.com` (done in C4)
- [x] D1 Brevo: peyyala.com **Authenticated** (DKIM, DMARC and ownership records) ([phase-d-01](phase-d-01-brevo-domain.md))
- [x] D2 Brevo sender Peyyala `<notifications@peyyala.com>`: verified, DKIM and DMARC ok ([phase-d-02](phase-d-02-brevo-sender.md))
- [x] D3 Brevo API keys `peyyala-prod` and `peyyala-local-test` (no expiry); Brevo IP blocking on, laptop and server authorized ([phase-d-03](phase-d-03-brevo-keys.md))
- [x] D4 Real test email: inbox, SPF/DKIM/DMARC PASS; server IP authorized in Brevo ([phase-d-04](phase-d-04-test-email.md))
- [x] D5 Google OAuth client has origin `https://peyyala.com` and redirect URI `https://peyyala.com/api/auth/callback/google`; admin is a test user ([phase-d-05](phase-d-05-google-oauth.md))
- [x] D6 Domain hardening: DNSSEC enabled and published at .com, CAA for Let's Encrypt + Sectigo, transfer lock and auto-renew confirmed ([phase-d-06](phase-d-06-domain-hardening.md))

### Phase E: first deploy (done 2026-10-26; live since 2026-10-25 23:40 IST)
- [x] E1 Production `.env` filled in and every value checked ([phase-e-01](phase-e-01-env.md))
- [x] E2 `main` updated to `dev` (`f613776`) after lint, type-check and a secret scan
- [x] E3 First deploy: migrated, starting content loaded, built in ~1.5 min, live and healthy ([phase-e-03](phase-e-03-first-deploy.md))
- [x] `https://peyyala.com/api/health` shows the latest commit on `main` (`f613776`) ([04](04-health-check.md))
- [x] E4 Live checks: pages, HTTPS, security headers, images, previews; database connection `ssl = t`; no errors; backup has the data ([phase-e-04](phase-e-04-live-checks.md))
- [x] E5 Google sign-in works; an admin save shows on the site immediately ([phase-e-05](phase-e-05-user-checks.md))
- [x] E5 Upload to the prod bucket works (public, optimized, preview) ([phase-e-05](phase-e-05-user-checks.md)); upload the remaining real screenshots and resume whenever you like
- [x] E5 Contact form: saved and delivered through Brevo ([phase-e-05](phase-e-05-user-checks.md))
- [x] E6 Reboot with the site running: back in ~25 s, everything restarted, admin edits kept ([phase-e-06](phase-e-06-reboot-test.md))
- [x] E7 Wrap-up: README updated, `X-Powered-By` off, page title follows the tagline; first update deploy (`b3dc58b`) ([phase-e-07](phase-e-07-wrap-up.md))

### Phase F: automatic deploys
- [ ] GitHub Actions: on push to `main`, run lint and type-check, then SSH in and run `deploy.sh`
- [ ] Secrets in GitHub: deploy SSH key (not your personal one), server address, known-hosts entry

### Phase G: operations
- [ ] UptimeRobot on `https://peyyala.com/api/health`, every 5 minutes ([04](04-health-check.md))
- [ ] Test a restore once, from a nightly dump into a scratch database ([phase-c-07](phase-c-07-backups.md))
- [ ] After a few clean weeks: DMARC `p=none` → `p=quarantine` ([phase-d-01](phase-d-01-brevo-domain.md))
- [ ] Monthly: check the AWS bill against the budget

### Phase H: other projects, then clean up
- [ ] Move each project (own user, folder, database and login, buckets, IAM user, Caddy site, PM2 app, port)
- [ ] Final snapshot of the old RDS and backup of the old EC2, then delete the old resources
- [ ] Check billing the week after
- [ ] Lower the budget to about $70 ([phase-b-01](phase-b-01-budget.md))

## Everyday commands

On the server, as the project user: `sudo -iu peyyala`.

| Task | Command |
|---|---|
| Deploy the latest `main` | `/srv/peyyala/prod/deploy.sh` |
| Go back one release | `/srv/peyyala/prod/deploy.sh rollback` |
| Is it up, and which commit? | `curl -s http://127.0.0.1:3001/api/health` or open `https://peyyala.com/api/health` |
| Live logs | `pm2 logs peyyala-prod` |
| Status, restarts, memory | `pm2 ls` |
| Restart by hand | `pm2 restart peyyala-prod` |
| Releases on disk | `ls /srv/peyyala/prod/releases` |
| Database copies | `ls -lt /srv/peyyala/prod/backups` |
| Restore a copy | see "Restoring a database copy" in [06](06-deploy-script.md) |

On the laptop, making a database change: edit `src/server/db/schema.ts`,
then `pnpm db:generate` and `pnpm db:migrate`. Follow the add-first rule in
[05](05-migrations.md).
