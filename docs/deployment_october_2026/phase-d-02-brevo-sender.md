# Phase D, step 2: Brevo sender

## Why

The site's notification emails need a "from" address Brevo has verified.
`notifications@peyyala.com` needs no mailbox: nobody replies to it, because
each notification's Reply-To is the visitor who wrote
([01](01-brevo-email.md)).

## Done (2026-10-25)

By Claude in your Chrome: Brevo > Settings > Senders, domains, IPs >
Senders > **Add sender**:

- From Name: `Peyyala`
- From Email: `notifications@peyyala.com`

Brevo answered "The sender Peyyala is successfully added" and offered a
branded subdomain (optional link tracking on your domain): skipped, not
needed.

Because peyyala.com was already authenticated (D1), the sender was verified
at once, without a code by email.

## Checked

Senders list:

| Sender | Status | DKIM signature | DMARC |
|---|---|---|---|
| Peyyala `<notifications@peyyala.com>` | Verified | peyyala.com | configured |

That meets Google's, Yahoo's and Microsoft's sender requirements.

The account's other senders (`peyyala.dev@gmail.com`, Clinic OS) are
another project's and were left as they are.

The live site's setting: `MAIL_FROM=Peyyala <notifications@peyyala.com>`.

## Status

- [x] Sender added and verified
