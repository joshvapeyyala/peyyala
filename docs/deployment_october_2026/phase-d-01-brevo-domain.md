# Phase D, step 1: Brevo domain authentication

## Why

The site's notification emails say they're from `notifications@peyyala.com`
but are sent by Brevo's servers. Inboxes (Gmail and others) check whether
Brevo is allowed to send for peyyala.com; without proof, the emails are
likely to land in spam. The proof is a few DNS records only the domain's
owner could add:

| Record | Name | Value | What it proves |
|---|---|---|---|
| TXT | `@` (peyyala.com) | `brevo-code:0dfb4b6bd3ab3437d0790b24d945c65a` | ownership, for Brevo |
| CNAME | `brevo1._domainkey` | `b1.peyyala-com.dkim.brevo.com` | DKIM: each email carries a signature inboxes check against Brevo's key |
| CNAME | `brevo2._domainkey` | `b2.peyyala-com.dkim.brevo.com` | second DKIM key (Brevo rotates between them) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | DMARC: what inboxes do with mail failing the checks. `p=none` = monitor only, for now |

All are **DNS only** (grey cloud) in Cloudflare. A proxied (orange) DKIM
CNAME would break the signatures.

No SPF record is needed for Brevo's current setup (it isn't among the
records Brevo asked for). No MX record: the domain only sends.

## How it was done (2026-10-25)

Claude, in your Chrome (you signed in to Brevo and Cloudflare):

1. Brevo > Settings > Senders, domains, IPs > Domains: `peyyala.com` was
   already listed ("Not authenticated"), setup method "Other" (manual).
   Read the 4 records from the authentication page.
2. Cloudflare > peyyala.com > DNS > Records: added the 4 records, each
   checked as DNS only before saving.
3. Checked through Cloudflare's public resolver: all 4 published exactly as
   above; the DKIM CNAMEs resolve on to Brevo's keys.
4. Brevo > **Verify records**: all 4 "match". Then **Authenticate domain**:
   "Authentication is pending" (Brevo's own background check, up to 48 hours,
   usually under an hour).

"Not branded" in Brevo's list is a separate, optional feature (Brevo's link
tracking on a subdomain of yours). Not needed: the site's emails have no
tracked links.

## Later: tightening DMARC

After a few weeks of normal sending with no problems in Brevo's DMARC
reports, change the `_dmarc` record to `p=quarantine` (failing mail goes to
spam). Added to the Phase G checklist.

## Status

- [x] 4 records in Cloudflare, DNS only, publicly visible
- [x] Brevo: all records match
- [ ] Brevo's domain list shows peyyala.com as **Authenticated**
- [ ] Later (Phase G): DMARC `p=none` → `p=quarantine`
