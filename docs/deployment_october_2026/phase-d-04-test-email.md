# Phase D, step 4: Real test email

## Why

Item 1's last open check: an email sent the way the site sends it arrives in
the inbox (not spam), from the right sender, with Reply going to the visitor,
and passes the authentication checks set up in D1.

## How it was done (2026-10-25)

1. You added to `.env.local`: `MAIL_DRIVER=brevo`,
   `MAIL_FROM=Peyyala <notifications@peyyala.com>`, `BREVO_API_KEY=` (the
   `peyyala-local-test` key). Claude checked them by name only.
2. **First attempt, through the local contact form** (Chrome,
   `localhost:3000/contact`): the site said "Message sent", but Brevo's log
   stayed empty.
3. **Second attempt, calling the site's own `sendMail()`** (`src/server/mail.ts`)
   with `.env.local`'s settings showed why:
   `Brevo refused the email (401): ... unrecognised IP address 43.227.131.16`.
   Brevo blocks API keys used from addresses it hasn't seen, even though its
   Authorized IPs page had shown blocking as off for API keys.
4. With your go-ahead, Claude authorized in Brevo (Settings > Security >
   Authorized IPs > Authorize IP addresses): `43.227.131.16` (the laptop's
   current address) and **`52.66.16.188` (the server, in advance, so the live
   site's first email isn't blocked)**. The page then showed blocking for API
   keys as **Activated**; Claude didn't switch it, and it was left on (the
   safer setting).
5. **Third attempt** (same `sendMail()` call): "Brevo accepted the email".

The contact-form message from step 2 was saved in the local admin inbox as
designed; only its email had failed.

## Result

Brevo > Transactional > Email > Logs: **Sent**, then **Delivered**,
2026-10-25 20:25, from `notifications@peyyala.com` to
`joshvapeyyala@gmail.com`.

In Gmail (checked by you):

| Check | Result |
|---|---|
| Folder | **Inbox** |
| SPF | **PASS** |
| DKIM | **PASS** |
| DMARC | **PASS** |

## Things to know

- **The laptop's address changes now and then** (home internet). If a local
  email test fails with "unrecognised IP address", authorize the new address
  in Brevo, or keep testing with `MAIL_DRIVER=console`. The server's address
  is fixed and already authorized.
- **Day-to-day local work:** set `MAIL_DRIVER=console` in `.env.local` again,
  so contact-form tests print in the terminal instead of sending real email.
  Keep `MAIL_FROM` and `BREVO_API_KEY` there for the next email test.
- A running `pnpm dev` reads `MAIL_DRIVER` when it starts: restart it after
  changing that line.

## Status

- [x] Test email delivered to the inbox; SPF, DKIM, DMARC all PASS
- [x] Server address `52.66.16.188` authorized in Brevo in advance
- [ ] Laptop back on `MAIL_DRIVER=console` (you)
- [ ] Email from the live site (Phase E)
