# Phase D, step 6: Domain hardening

## Why

Cheap protection for the domain everything else hangs on:

| Protection | Stops |
|---|---|
| **DNSSEC** | forged DNS answers (someone pointing visitors or email checks at the wrong server) |
| **CAA** | certificate authorities other than the listed ones issuing HTTPS certificates for peyyala.com |
| **Transfer lock** | the domain being moved to another registrar without you |
| **Auto-renew** | the domain lapsing and being bought by someone else |

## Done (2026-10-25)

By Claude in your Chrome (signed in to Cloudflare):

1. **DNSSEC:** Cloudflare > peyyala.com > DNS > Settings > **Enable DNSSEC**.
   Status: "pending while we automatically add the DS record on your domain"
   (Cloudflare is also the registrar, so it publishes the DS record to .com
   itself; usually within hours).
2. **CAA:** two records on `peyyala.com`, flags 0, tag `issue` ("Only allow
   specific hostnames"):
   - `letsencrypt.org`: what Caddy uses
   - `sectigo.com`: Caddy's automatic fallback (ZeroSSL issues through
     Sectigo), so a Let's Encrypt outage can't block renewals
3. **Registration** (looked at, nothing changed): Active, expires
   2031-10-24, auto-renew scheduled for 2031-09-24.

## Checked (2026-10-25)

From the .com registry (RDAP) and public DNS:

| Check | Result |
|---|---|
| Registry status | `client transfer prohibited` (transfer lock on) |
| Registrar | Cloudflare, Inc. |
| Registered / expires | 2026-10-24 / 2031-10-24 |
| DNSSEC at the registry (DS) | not yet: pending |
| CAA | ours (`letsencrypt.org`, `sectigo.com`) plus four Cloudflare added itself (see below) |

### Cloudflare's extra CAA entries

Because Cloudflare's **Universal SSL** is on for the zone, Cloudflare
automatically adds the authorities it uses for its own certificates
(`comodoca.com`, `digicert.com`, `pki.goog`, `ssl.com`, with `issue` and
`issuewild`) whenever a zone has CAA records. They only matter if a record is
ever proxied (orange cloud). With everything on the grey cloud, Universal SSL
isn't used, and switching it off would remove them; the trade-off is that it
would have to be switched back on before proxying anything.

## Auto-renew and payment

Renewal (~$11/year at current prices, 2031) is charged to the payment method
on the Cloudflare account, currently a friend's card. Before September 2031:
check Cloudflare > Manage account > Billing has a method that will work.

## Status

- [x] DNSSEC enabled in Cloudflare
- [x] DNSSEC active at the registry (DS published, checked later on 2026-10-25)
- [x] CAA: Let's Encrypt and Sectigo
- [x] Decided (2026-10-25): keep Cloudflare's extra CAA entries (Universal SSL stays on, so the orange cloud remains an option)
- [x] Transfer lock on; auto-renew on, expires 2031-10-24
