# Phase B, step 8: Backup storage

## Why

Every night a job on the server (Phase C) saves a copy of each database
(`pg_dump`) to a private S3 bucket. On the Free plan RDS keeps only 1 day of
its own backups, so these nightly copies are the main safety net.

| Protection                    | How |
| ----------------------------- | --- |
| Nobody on the internet can read it | all four Block Public Access settings on, no bucket policy |
| It can't grow without limit   | a lifecycle rule deletes copies after 30 days |
| A hacked server can't destroy or steal backups | the server's key (`shared-backup`) may only **add** files: no read, list or delete |
| Overwriting a backup doesn't lose it | versioning keeps the earlier version (deleted 30 days later) |

Restoring is done as `joshva-admin` (console or CLI), never with the server's key.

Time: about 10 minutes. Cost: a few cents a month.

## Steps (as `joshva-admin`, region Mumbai)

### A. Create the bucket

**S3** > **Create bucket**:

1. Bucket type: **General purpose**. Name: `joshua-peyyala-db-backups`.
2. Object Ownership: **ACLs disabled**.
3. Block Public Access: **Block all public access: ticked** (all four boxes).
   Unlike the uploads buckets, change nothing here.
4. **Bucket Versioning: Enable**.
5. Encryption: SSE-S3 (default).
6. Tags: `Stack` = `shared`.
7. **Create bucket**.

### B. Delete copies after 30 days

The bucket > **Management** > **Lifecycle rules** > **Create lifecycle rule**:

1. Name: `expire-after-30-days`.
2. Scope: **Apply to all objects in the bucket**, tick the acknowledgement.
3. Lifecycle rule actions, tick:
   - **Expire current versions of objects**
   - **Permanently delete noncurrent versions of objects**
   - **Delete expired object delete markers or incomplete multipart uploads**
4. Expire current versions: `30` days after object creation.
5. Permanently delete noncurrent versions: `30` days after objects become
   noncurrent (leave "number of newer versions to retain" empty).
6. Incomplete multipart uploads: tick **Delete incomplete multipart uploads**,
   `7` days. (If the console only lets you pick one of "expired delete
   markers" or "incomplete multipart uploads", pick the multipart one.)
7. **Create rule**.

### C. Create the server's user

**IAM** > **Users** > **Create user**:

1. Name `shared-backup`. **No** console access. Next.
2. Skip permissions. Next. Tag `Stack` = `shared`. **Create user**.
3. Open the user > **Permissions** > **Add permissions** > **Create inline
   policy** > **JSON**, paste:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AddBackupsOnly",
         "Effect": "Allow",
         "Action": "s3:PutObject",
         "Resource": "arn:aws:s3:::joshua-peyyala-db-backups/*"
       }
     ]
   }
   ```

   Policy name `joshua-peyyala-db-backups-write-only` > **Create policy**.

### D. Create its access key

The user > **Security credentials** > **Create access key** > **Application
running outside AWS** > description `server` > **Create**. Save the **Access
key** and **Secret access key** with your other important passwords (name:
`AWS shared-backup key`). The secret is shown only once.

It goes onto the server in Phase C (readable by root only, used by the
nightly job).

## How to check

- **Properties:** Bucket Versioning **Enabled**.
- **Permissions:** Block all public access **On**; Bucket policy empty.
- **Management:** rule `expire-after-30-days`, status **Enabled**.
- From the laptop, without keys, the bucket address answers 403.

The nightly job's first run (Phase C) is the real test: a file appears in
the bucket the next morning.

## Status

- [x] Bucket `joshua-peyyala-db-backups`: private, versioning on (2026-10-25;
      `joshua-db-backups` was taken by another AWS account)
- [x] Lifecycle rule `expire-after-30-days`
- [x] User `shared-backup` with the write-only policy
- [x] Access key `server` created and saved
- [x] Checked from the laptop: bucket in `ap-south-1`; listing and file
      reads refused without keys (403)
- [ ] First nightly backup lands in the bucket (Phase C)
