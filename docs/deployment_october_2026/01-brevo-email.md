# 1. Brevo email driver

Part of Phase A (code preparation) of the move to AWS.

## Why

When someone sends a message through the contact form, the site saves it in
the admin inbox and then emails the admin about it. Locally there is nothing
to send email with, so the email is printed in the terminal. The live site
needs a real email service: Brevo (free plan, 300 emails a day).

## What changed

`src/server/mail.ts` has a new driver. A setting picks how email is sent:

| `MAIL_DRIVER` | What happens                     | Used on     |
| ------------- | -------------------------------- | ----------- |
| `console`     | printed in the terminal          | local       |
| `brevo`       | sent through Brevo's HTTP API    | production  |

The earlier Resend driver was removed: Brevo replaces it.

- No new package: sending is one `fetch` to `https://api.brevo.com/v3/smtp/email`.
- A 10-second limit, so a slow Brevo can't hang the request.
- The visitor's address goes in Reply-To, so pressing Reply in Gmail answers
  the visitor directly.
- The message is saved before the email is sent. If Brevo refuses or times
  out, the message is still in the admin inbox and the server log says why.

## Settings

| Setting         | Local     | Production                               |
| --------------- | --------- | ---------------------------------------- |
| `MAIL_DRIVER`   | `console` | `brevo`                                  |
| `MAIL_TO`       | empty     | empty (means `ADMIN_EMAIL`)              |
| `MAIL_FROM`     | empty     | `Peyyala <notifications@peyyala.com>`    |
| `BREVO_API_KEY` | empty     | from Brevo > SMTP & API > API keys       |

Locally, none of this is needed day to day: `console` prints the email.

## Setting up Brevo (once)

1. **Authenticate the domain.** Brevo > Senders, Domains & Dedicated IPs >
   Domains > Add a domain > `peyyala.com`. Let Brevo add the DNS records to
   Cloudflare automatically, or copy them into Cloudflare > DNS by hand.
   Wait until Brevo shows the domain as authenticated.
2. **Add the sender.** Senders > add `notifications@peyyala.com`, name
   `Peyyala`. With the domain authenticated, no real mailbox is needed.
3. **Create an API key.** SMTP & API > API keys > Generate. Copy it right
   away: Brevo shows it only once. Make one key per place it's used:
   - `peyyala-local-test` for testing on the laptop
   - `peyyala-prod` for the live site
   
   If one leaks, delete just that key; the other keeps working.

## Testing on the laptop

1. In `.env.local`:
   ```
   MAIL_DRIVER=brevo
   MAIL_FROM=Peyyala <notifications@peyyala.com>
   BREVO_API_KEY=<the peyyala-local-test key>
   ```
2. `pnpm dev`, send a message from `/contact`.
3. The email arrives at `ADMIN_EMAIL`, and Reply goes to the visitor's address.
4. Set `MAIL_DRIVER=console` again.

## Going live (Phase E)

1. In the server's `/srv/peyyala/prod/.env`, set the production values from
   the Settings table, with the `peyyala-prod` key.
2. If Brevo refuses with "unrecognised IP", approve the server's Elastic IP
   under Brevo > Security > Authorised IPs. The same applies to the laptop
   while testing.
3. Deploy, then send a message from `https://peyyala.com/contact` and check
   it arrives.
4. If an email ever goes missing, the message is still in the admin inbox.
   The reason is in the server log: `pm2 logs peyyala-prod`, look for
   "the email about it failed". Next to it is Brevo's answer ("Brevo refused
   the email ...") or a timeout.

## Status

- [x] Driver written, Resend removed
- [ ] Domain authenticated (records done, [phase-d-01](phase-d-01-brevo-domain.md)) and sender `notifications@peyyala.com` added in Brevo
- [ ] Real test email sent from the laptop
- [ ] Production key in the server's `.env`, test email from the live site
