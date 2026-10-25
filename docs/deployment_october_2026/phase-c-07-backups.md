# Phase C, step 7: Nightly backups

## Why

On the Free plan RDS keeps only 1 day of its own backups. These nightly
copies are the main safety net: 30 days, in a bucket the server can add to
but not read or delete from.

Every night at **02:30 IST**, `/usr/local/sbin/backup-databases`:

1. finds every project with a `/srv/<project>/prod/.env`
2. dumps its database with `pg_dump` (custom format), using that project's
   own login; connection details go through the environment, never the
   command line where other users could read them
3. uploads it to `s3://joshua-peyyala-db-backups/<project>/<YYYY-MM-DD_HHMM>.dump`
   with the `shared-backup` key
4. deletes the local copy
5. pings healthchecks.io: start, then success or fail

The bucket deletes copies after 30 days ([phase-b-08](phase-b-08-backups-bucket.md)).

| On the server | What | Access |
|---|---|---|
| `/usr/local/sbin/backup-databases` | the backup program | root only |
| `/root/.aws/credentials`, `/root/.aws/config` | the `shared-backup` key (profile `shared-backup`) | root only |
| `/etc/db-backups.conf` | bucket, profile, healthchecks.io ping URL | root only |
| `backup-databases.timer` / `.service` | systemd: daily 02:30; runs after a boot if 02:30 was missed | |

The AWS CLI (v2, from Amazon) does the upload.

## Alerts: healthchecks.io

Free account; check **db-backups (shared-web-1)**: cron `30 2 * * *`,
Asia/Kolkata, grace 2 hours, email notifications. If a night's run fails or
doesn't happen at all, it emails you.

## How it was done

Script: [`scripts/server/c7-backups.sh`](../../scripts/server/c7-backups.sh),
run as root, once per server. It asks for the `shared-backup` access key, its
secret (hidden) and the ping URL; again only with `--reconfigure`.

```powershell
ssh -t -i "$HOME\.ssh\shared-web-key.pem" ubuntu@52.66.16.188 "sudo bash <path>/c7-backups.sh"
```

### Problems found by the first run (2026-10-25), both fixed

| Problem | Cause | Fix |
|---|---|---|
| `pg_dump: error: aborting because of server version mismatch` (server 18.3, pg_dump 17.11) | RDS was created as PostgreSQL 18, not 17 | kept 18; server tools and laptop Docker moved to 18 ([phase-c-03](phase-c-03-database-tools.md)) |
| `not authorized to perform: s3:PutObject` on `joshua-peyyala-db-backups/...` | the `shared-backup` policy didn't match the bucket (most likely still the first name, `joshua-db-backups`) | policy corrected in IAM to `arn:aws:s3:::joshua-peyyala-db-backups/*` |

## Checked (2026-10-25)

| Check | Result |
|---|---|
| Backup run through systemd (as the timer runs it) | success: `peyyala/2026-10-25_1923.dump` (4 KB: no tables yet) |
| The key **lists** the bucket | denied (AccessDenied) |
| The key **reads** a backup | denied (403) |
| The key **deletes** a backup | denied (AccessDenied) |
| `peyyala` reads the key | no |
| Next run | Mon 2026-10-26 02:30 IST |

## Day to day

| Task | Command / place |
|---|---|
| Run a backup now | `sudo systemctl start backup-databases.service` |
| Last runs' output | `sudo journalctl -u backup-databases.service -n 30` |
| Next scheduled run | `systemctl list-timers backup-databases.timer` |
| See the backups | S3 console > `joshua-peyyala-db-backups` > project folder (as `joshva-admin`) |
| Change the key or ping URL | `sudo bash c7-backups.sh --reconfigure` |

### Restoring one

As `joshva-admin`, download the `.dump` from the S3 console, then restore it
into a scratch database first (laptop Docker, same Postgres 18):

```bash
docker exec peyyala-db-1 createdb -U peyyala restore_check
docker exec -i peyyala-db-1 pg_restore -U peyyala -d restore_check --no-owner < peyyala_2026-10-26_0230.dump
```

Restoring into the live database: see "Restoring a database copy" in
[06](06-deploy-script.md). Phase G includes one practice restore.

## Status

- [x] AWS CLI, `shared-backup` key (root only), healthchecks.io ping URL
- [x] Backup program and nightly timer
- [x] First backup uploaded; key can't list, read or delete
- [x] Backup with live data: `peyyala/2026-10-25_2349.dump` (32 KB) ([phase-e-04](phase-e-04-live-checks.md))
- [ ] First automatic run (02:30) and healthchecks.io shows it
