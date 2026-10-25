# Phase B, step 6: The database (RDS `shared-db-1`)

## Why

One managed PostgreSQL server for all projects. Each project gets its own
database and login inside it in Phase C (for this site: `peyyala_prod`).
"Managed" means AWS installs it, applies security updates, takes daily
backups and keeps the disk healthy.

| Choice                | Value                                           | Why |
| --------------------- | ----------------------------------------------- | --- |
| Engine                | PostgreSQL **18** (created as 18.3)             | 17 was planned; the form had 18 selected. Kept: newer, supported until Nov 2030. The laptop's Docker and the server's tools were moved to 18 to match |
| Template              | **Free tier**                                   | the Free plan only allows small, single-zone databases; this template sets that up |
| Size                  | `db.t4g.micro` (2 vCPU, 1 GB)                   | the smallest; plenty for a portfolio and a few small projects |
| Storage               | 20 GB gp3, grows by itself up to 50 GB          | starts small, can't run out |
| Zone                  | **`ap-south-1b`**, same as the server           | faster, and no charge for traffic between zones |
| Public access         | **No**                                          | not reachable from the internet at all |
| Firewall              | `shared-db-sg` only                             | only `shared-web-sg` servers can connect (step 3) |
| Encryption            | on                                              | data on disk and in backups is encrypted |
| Backups               | automatic, 7 days                               | restore to any moment in the last week |
| Deletion protection   | on                                              | can't be deleted by a mis-click |
| Master password       | self-managed, in your password manager          | AWS Secrets Manager would cost extra |

Cost: roughly $16–18 a month, from credits while on the Free plan.

Time: about 10 minutes of clicking, then 10–15 minutes while AWS creates it.

## How RDS is organised

```
RDS instance "shared-db-1"          created here (step 6), in the console
│   main login: shared_admin        the owner; only used to set things up
├── database "peyyala_prod"         created in Phase C by the setup script
│     login: peyyala_prod           only this site uses it
└── one database + login per project (Phase H)
```

The instance is the building, each database a flat, each login the key to
one flat. `shared_admin` is the manager's master key: never used by a site.
Cost is per instance, not per database.

## The master password

Either let AWS make it up (tick **Auto generate a password**, then after
creating, click **View connection details** in the blue bar and copy it: it's
shown once), or type your own (16+ letters and digits). Keep it with your
other important passwords. Needed in Phase C. If lost, it can be reset in the
console (Modify > new master password).

## Steps (as `joshva-admin`, region Mumbai)

**Aurora and RDS** > **Databases** > **Create database**:

1. **Choose a database creation method:** **Standard create** (not Easy create).
2. **Engine options:** **PostgreSQL**. Engine version: the newest
   **PostgreSQL 18.x** (the form's default; 17 was planned, see the table above).
3. **Templates:** **Free tier**.
4. **Availability and durability:** **Single-AZ DB instance deployment**
   (the template may already have chosen it).
5. **Settings:**
   - DB instance identifier: `shared-db-1`
   - Master username: `shared_admin`
   - Credentials management: **Self managed**
   - Password: tick **Auto generate a password**, or type your own twice
6. **Instance configuration:** Burstable classes > **`db.t4g.micro`**
   (if only `db.t3.micro` is offered, take that).
7. **Storage:**
   - Storage type: **General Purpose SSD (gp3)** (gp2 if gp3 isn't offered)
   - Allocated storage: `20` GiB
   - **Storage autoscaling** (expand "Additional storage configuration"):
     Enable, maximum `50` GiB
8. **Connectivity:**
   - Compute resource: **Don't connect to an EC2 compute resource**
   - Network type: IPv4
   - VPC: the default VPC
   - DB subnet group: the default (or "Create new DB subnet group")
   - **Public access: No**
   - VPC security group: **Choose existing** > select `shared-db-sg`, and
     **remove `default`** (click its ×)
   - **Availability Zone: `ap-south-1b`**
   - Certificate authority: leave the default (`rds-ca-rsa2048-g1`)
   - Database port: `5432`
9. **Database authentication:** **Password authentication**.
10. **Monitoring:** turn **off** Enhanced Monitoring (it costs extra). If
    Performance Insights / Database Insights offers a free option (7 days),
    leaving it on is fine; anything paid: off.
11. **Additional configuration** (expand):
    - Initial database name: **leave empty** (each project's database is made in Phase C)
    - DB parameter group: the default
    - **Enable automated backups:** on, retention **1 day** (the Free plan
      refuses 7: "The specified backup retention period exceeds the maximum
      available to free tier customers"). Backup window: No preference.
      Nightly copies to S3 (30 days, Phase C) are the main backup anyway.
      **After upgrading the plan:** Modify > Backup retention period > 7 >
      Apply immediately (no downtime)
    - **Copy tags to snapshots:** on
    - **Enable encryption:** on, key `aws/rds` (default)
    - Log exports: none
    - **Enable auto minor version upgrade:** on
    - Maintenance window: No preference
    - **Enable deletion protection:** on
12. **Tags** (if shown): `Stack` = `shared`.
13. Check the **Estimated monthly costs** box at the bottom, then **Create database**.

If you chose Auto generate: straight after creating, click **View connection
details** in the blue bar at the top and save the password. It's shown only
this once.

## How to check

When **Status** is **Available** (10–15 minutes), open `shared-db-1`:

- **Connectivity & security:**
  - **Endpoint:** `shared-db-1.xxxxxxxx.ap-south-1.rds.amazonaws.com`: copy it (not a secret)
  - Port 5432
  - Availability Zone `ap-south-1b`
  - **Publicly accessible: No**
  - VPC security groups: **only `shared-db-sg`**
- **Configuration:** engine version 18.x, instance class `db.t4g.micro`,
  storage encryption **Enabled**, deletion protection **Enabled**
- **Maintenance & backups:** automated backups **Enabled**, 7 days

Then, the real test (I run it): the server can reach the database on port
5432, and the laptop can't.

## Status

- [x] Master password saved somewhere safe (`shared_admin`)
- [x] `shared-db-1` created (2026-10-25), backups 1 day (Free plan)
- [ ] Settings checked in the console (public access No, `shared-db-sg` only, encrypted, deletion protection)
- [x] Endpoint: `shared-db-1.c1kuqgqk49fk.ap-south-1.rds.amazonaws.com`
      (private address `172.31.14.214`)
- [x] Tested (2026-10-25):
  - from the server: port 5432 **open**; TLS 1.3; certificate issued by
    "Amazon RDS ap-south-1 Subordinate CA RSA2048 G1" for this endpoint,
    verified with Amazon's global bundle (`Verify return code: 0 (ok)`), as
    `sslmode=verify-full` will require ([03](03-database-ssl.md))
  - from the laptop: **blocked** (the name resolves only to a private address)
