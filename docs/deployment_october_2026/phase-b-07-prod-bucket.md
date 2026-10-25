# Phase B, step 7: Live uploads bucket

## Why

The live site stores its uploads (project screenshots, the resume PDF) in its
own bucket, `joshua-portfolio-prod`, separate from the laptop's
`joshua-portfolio-dev`. It has its own IAM user, `joshua-portfolio-prod-app`,
whose key only works on this bucket, and that key lives only on the server.

Same steps as the dev bucket ([02-s3-storage.md](02-s3-storage.md), "Setting
up AWS"), with `prod` in place of `dev` everywhere.

Time: about 10 minutes. Cost: pennies (from credits).

## Steps (as `joshva-admin`, region Mumbai)

### A. Create the bucket

**S3** > **Create bucket**:

1. Bucket type: **General purpose**. Name: `joshua-portfolio-prod`.
2. Object Ownership: **ACLs disabled**.
3. Block Public Access: untick **Block all public access**, then tick only
   the two ACL lines again (leave the two "bucket policies" lines unticked),
   and tick the acknowledgement.
4. Versioning off, encryption SSE-S3 (defaults).
5. Tags: `Project` = `peyyala`, `Stack` = `shared`.
6. **Create bucket**.

### B. Allow public reads

The bucket > **Permissions** > **Bucket policy** > **Edit**, paste, **Save**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::joshua-portfolio-prod/*"
    }
  ]
}
```

### C. Create the app's user

**IAM** > **Users** > **Create user**:

1. Name `joshua-portfolio-prod-app`. **No** console access. Next.
2. Skip permissions. Next. Tag `Stack` = `shared`. **Create user**.
3. Open the user > **Permissions** > **Add permissions** > **Create inline
   policy** > **JSON**, paste:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::joshua-portfolio-prod/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::joshua-portfolio-prod"
       }
     ]
   }
   ```

   Policy name `joshua-portfolio-prod-bucket` > **Create policy**.

### D. Create its access key

The user > **Security credentials** > **Create access key** > **Application
running outside AWS** > description `server` > **Create**. Save the
**Access key** and **Secret access key** with your other important passwords
(name: `AWS joshua-portfolio-prod-app key`): the secret is shown only once.

This key goes into the server's `/srv/peyyala/prod/.env` in Phase E. Never
into the laptop's `.env.local`.

## How to check

From the laptop, without keys:

- a missing file in the bucket gives `403` (public reads allowed, but nothing
  to read), and
- the bucket address itself gives `403` (listing is not public).

The full upload test (with the key) happens on the live site in Phase E.

## Status

- [x] Bucket `joshua-portfolio-prod` created (2026-10-25)
- [x] User `joshua-portfolio-prod-app` with the inline policy
- [x] Access key `server` created and saved
- [x] Checked from the laptop: bucket exists in `ap-south-1`, listing refused (403)
- [ ] Public reads: tested with the first upload on the live site (Phase E).
      An empty bucket answers 403 either way, so it can't be told apart before
