# 2. S3 storage driver

Part of Phase A (code preparation) of the move to AWS.

## Why

Uploads (project screenshots, the resume PDF) used to be saved in a
`./storage` folder and served by the app at `/uploads/...`. On a server that
breaks down:

- files on the server's disk are lost if the server is rebuilt or replaced
- every image a visitor loads goes through the app, using its memory and CPU
- the laptop and the live site would only be kept apart by luck

S3 is Amazon's file storage. Files live in a "bucket", are kept safely, aren't
tied to any server, and visitors load them straight from Amazon.

## What changed

- `src/server/storage.ts` now stores files in S3 only, using Amazon's official
  package `@aws-sdk/client-s3`. The local folder driver is gone.
- `src/app/uploads/[...key]/route.ts` is deleted: nothing is served from the
  app any more.
- The automated tests were deleted (they relied on the local folder). Tests
  get rewritten later.

The rest of the app didn't change: it only calls these functions.

| Function     | What it does in S3                                                          |
| ------------ | --------------------------------------------------------------------------- |
| `put`        | uploads the file with its type, "cache forever", and its own download name |
| `read`       | downloads a file (used for link-preview images)                             |
| `readUrl`    | same, but also reads files that ship in `/public`                           |
| `fileExists` | asks the bucket if a file is there (the admin dashboard's resume warning)  |
| `remove`     | deletes a file when it's replaced or its project is deleted                |

Details:

- Files are named after a hash of their contents, e.g.
  `screenshots/3f2a9c1e5b7d0a42/caredeck.png`, so a URL always holds the same
  bytes and browsers can cache it forever.
- An upload's URL is the bucket's address plus that name, e.g.
  `https://joshua-portfolio-prod.s3.ap-south-1.amazonaws.com/screenshots/...`.
  That full URL is what's saved in the database.
- If deleting an old file fails after a save, the save still counts: the
  error is logged ("Storage: couldn't delete ...") and the file stays in the
  bucket. A leftover file costs next to nothing.
- Images that ship with the code (in `/public`) keep working as before.

## One bucket per environment

| | Laptop | Live site |
|---|---|---|
| Bucket | `joshua-portfolio-dev` | `joshua-portfolio-prod` |

Uploading on the laptop can never touch the live site's files. Other projects
follow the same pattern: `<project>-dev` and `<project>-prod`.

Who can do what:

- **Anyone can view** files (they're shown on the public site): the bucket
  policy allows public reads only.
- **Only the app can add or delete** them, with the keys of an IAM user.
  Each bucket has its own user (`joshua-portfolio-dev-app`,
  `joshua-portfolio-prod-app`), so a leaked laptop key can't touch the live
  site's files.

The laptop needs the internet to upload. Browsing the local site works offline.

## Settings

| Setting                | Laptop (`.env.local`)                                   | Live site (server `.env`)                                |
| ---------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `S3_BUCKET`            | `joshua-portfolio-dev`                                  | `joshua-portfolio-prod`                                  |
| `S3_REGION`            | `ap-south-1`                                            | `ap-south-1`                                             |
| `S3_ACCESS_KEY_ID`     | `joshua-portfolio-dev-app`'s key                        | `joshua-portfolio-prod-app`'s key                        |
| `S3_SECRET_ACCESS_KEY` | `joshua-portfolio-dev-app`'s secret                     | `joshua-portfolio-prod-app`'s secret                     |
| `STORAGE_PUBLIC_URL`   | `https://joshua-portfolio-dev.s3.ap-south-1.amazonaws.com` | `https://joshua-portfolio-prod.s3.ap-south-1.amazonaws.com` |

`STORAGE_PUBLIC_URL` also tells `next/image` (in `next.config.ts`) which
address it may load images from. Changing it needs a restart.

Until these are set, the site still runs; only uploading (and the resume
check on the admin dashboard, once a resume is uploaded) fails, with a message
naming the missing settings.

## Setting up AWS

Do steps A–D for `joshua-portfolio-dev` first. Repeat them for
`joshua-portfolio-prod` (replace `dev` with `prod` everywhere) before going
live. In the AWS console, check the region at the top right is
**Asia Pacific (Mumbai) ap-south-1**.

### A. Create the bucket

S3 > Create bucket:

1. Bucket type: **General purpose**. Name: `joshua-portfolio-dev`.
2. Object Ownership: **ACLs disabled** (the default).
3. Block Public Access: untick **Block all public access**, then tick only
   the two ACL lines again:
   - [x] Block public access granted through new ACLs
   - [x] Block public access granted through any ACLs
   - [ ] Block public access granted through new public bucket policies
   - [ ] Block public and cross-account access through any public bucket policies

   Tick the acknowledgement. (Public reads come from the bucket policy in
   step B, never from ACLs.)
4. Versioning: off. Encryption: SSE-S3 (the default).
5. Tags: `Project` = `peyyala`.
6. Create bucket.

### B. Allow public reads

The bucket > Permissions > Bucket policy > Edit, paste, Save:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::joshua-portfolio-dev/*"
    }
  ]
}
```

Anyone can open a file whose address they know. Nobody can list the bucket
or change anything.

### C. Create the app's IAM user

IAM > Users > Create user:

1. Name: `joshua-portfolio-dev-app`. Don't give it console access. Next.
2. Permissions: skip (no groups or policies). Next, Create user.
3. Open the user > Permissions > Add permissions > Create inline policy >
   JSON, paste:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::joshua-portfolio-dev/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::joshua-portfolio-dev"
       }
     ]
   }
   ```

   Policy name: `joshua-portfolio-dev-bucket`. Create policy.

   `ListBucket` is needed so that asking for a missing file answers "not
   found" instead of "access denied" (the dashboard's resume check relies on it).

### D. Create its access key

The user > Security credentials > Create access key:

1. Use case: **Application running outside AWS**. Next.
2. Description: `laptop` (or `server` for the prod user). Create.
3. Copy the **Access key** and **Secret access key** now: the secret is shown
   only once. Don't email or commit them.

### E. Put them in `.env.local`

```
S3_BUCKET=joshua-portfolio-dev
S3_REGION=ap-south-1
S3_ACCESS_KEY_ID=<access key from D>
S3_SECRET_ACCESS_KEY=<secret access key from D>
STORAGE_PUBLIC_URL=https://joshua-portfolio-dev.s3.ap-south-1.amazonaws.com
```

Stop and start `pnpm dev` again: `next.config.ts` reads `STORAGE_PUBLIC_URL`
only when it starts. Then run the test below.

The prod user's key goes in the server's `.env` in Phase E, never on the laptop.

## How to test it (after Phase B)

1. `pnpm dev`, sign in to the admin.
2. Upload a screenshot on a project. It shows in the admin and on
   `/work/<project>`, and its address starts with the dev bucket's.
3. The file is in the bucket (S3 console), with type `image/png` (or jpeg,
   webp) and Cache-Control `public, max-age=31536000, immutable`.
4. Share-preview image for that project (`/work/<project>/opengraph-image...`)
   shows the screenshot.
5. Upload a different screenshot: the old file disappears from the bucket.
6. Upload the resume PDF: it opens in the browser, and "Save as" offers its
   own file name. The dashboard shows no "missing resume" warning.
7. Delete a test project: its screenshot disappears from the bucket.

## Going live (Phase E)

1. In the server's `/srv/peyyala/prod/.env`, set the live-site values from the
   Settings table, with the `joshua-portfolio-prod-app` user's key.
2. Deploy, then upload a screenshot and the resume in the live admin and
   check they show on `https://peyyala.com`.
3. Uploads made on the laptop live in the dev bucket. Upload the real
   screenshots and resume again in the live admin.

## Status

- [x] Driver written, local driver and `/uploads` route removed
- [x] Link-preview images still work with files in `/public`
- [x] Dev bucket, user and key created; `.env.local` filled in
- [x] Storage functions checked against `joshua-portfolio-dev` (2026-10-25):
      upload, read, exists, public load without keys, content type, cache
      header, download name, bucket not listable, delete
- [x] Tested through the admin (2026-10-25): screenshot upload shows in the
      admin, on the project page and in its link preview; replacing it deletes
      the old file; resume upload has the right headers; the dashboard's
      resume check works through S3. Test files removed afterwards.
- [ ] Prod bucket, user and key created
- [x] Live-site values on the server, uploads checked on peyyala.com ([phase-e-05](phase-e-05-user-checks.md))
- [ ] Tests rewritten (later)
