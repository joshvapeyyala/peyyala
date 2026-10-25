# Phase E, step 5: Live checks through the site itself

Run on 2026-10-25, on https://peyyala.com.

## 1. Google sign-in (you)

Signed in at `/admin` with `joshvapeyyala@gmail.com`: reached the dashboard.
In the live database: 1 user, active sessions. No errors logged.

## 2. Admin edit shows immediately (you)

Changed the tagline in Profile: the public site showed it straight away
(tag-based refresh, no redeploy). Database: `profile.tagline` = "Full-stack
developer".

You also switched the site's design to Wave in Appearance.

## 3. Upload to the prod bucket (Claude, in your signed-in Chrome)

Uploaded Xpensefy's own current screenshot to the Xpensefy project, so the
picture stays the same but now comes from S3 instead of the code's `public/`
folder.

| Check | Result |
|---|---|
| Saved address | `https://joshua-portfolio-prod.s3.ap-south-1.amazonaws.com/screenshots/97f3ee779d81fc92/xpensefy.png` |
| Loads publicly | 200, `image/png`, `Cache-Control: public, max-age=31536000, immutable` |
| Live project page | uses the S3 address |
| Optimized image (`/_next/image` from S3) | 200, `image/png`: the build allowed the prod bucket (`STORAGE_PUBLIC_URL`) |
| Link preview (reads the file back from S3) | 200, `image/png` |

## 4. Contact form (Claude, in your Chrome)

Sent from `https://peyyala.com/contact` as "E5 Live Test Visitor",
`e5-live-test@example.com`, company "Launch Check Ltd", topic job.

| Check | Result |
|---|---|
| Page | "Message sent" |
| Saved in the database | yes, with a hashed visitor id (not the address) |
| Server error log | empty |
| Brevo log | **Sent**, then **Delivered**, 23:57, from `notifications@peyyala.com` to `joshvapeyyala@gmail.com`, subject "[Portfolio] A job role: E5 Live Test Visitor (Launch Check Ltd)" |

So the live site sends through Brevo from the server's authorized address.

To confirm in Gmail (you): the email is in the Inbox, and Reply goes to
`e5-live-test@example.com`. The message is also in the admin's Inbox.

## Status

- [x] Google sign-in
- [x] Admin edit live immediately
- [x] Upload to `joshua-portfolio-prod`, public read, image optimizer, preview
- [x] Contact form: saved, emailed through Brevo, delivered
- [ ] Gmail: inbox + Reply-To; admin Inbox shows the message (you)
