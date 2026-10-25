# Phase D, step 3: Brevo API keys

## Why

One key per place that sends, so either can be deleted without breaking the
other:

| Key | Used by | Goes in |
|---|---|---|
| `peyyala-prod` | the live site | the server's `/srv/peyyala/prod/.env` (Phase E) |
| `peyyala-local-test` | the laptop, for the test email (D4) | `.env.local`, only while testing |

## Done (2026-10-25)

You generated both keys (Brevo > Settings > SMTP & API > API keys & MCP >
Generate API key) and saved them in your password manager. They're shown only
once; Claude didn't see them.

| Setting | Chosen |
|---|---|
| Expiry | **none** for both (Brevo keys can expire; an expired key would silently stop the site's emails) |
| Permissions | Brevo's default for both (full access to the Brevo account's API) |

The account's other key, `BREVO_API_KEY` (Clinic OS, expires 2027-08-12), is
another project's and wasn't touched.

### Authorized IPs

Brevo > Settings > Security > Authorized IPs showed blocking of unknown
addresses as off for API keys. It wasn't: the D4 test was refused from the
laptop's address, and the page then showed blocking as on. Both the laptop
(`43.227.131.16`) and the server (`52.66.16.188`) are now authorized
([phase-d-04](phase-d-04-test-email.md)).

## Worth knowing

- **Full access:** with the default permissions, anyone holding
  `peyyala-prod` could use the whole Brevo account (contacts, campaigns,
  other senders), not only send email. It lives in a file only the `peyyala`
  user can read. If Brevo offers narrower permissions when editing a key,
  "send transactional emails" alone is enough for this site.
- **Blocking is on** (see above): only authorized addresses can use the keys.
- **If a key leaks:** delete it in Brevo, generate a new one, update the
  `.env` that used it, and restart (`deploy.sh` or `pm2 restart`).

## Status

- [x] `peyyala-prod` created and saved (no expiry)
- [x] `peyyala-local-test` created and saved (no expiry)
- [x] Authorized IPs: blocking on; laptop and server authorized (D4)
- [ ] After D4: delete `peyyala-local-test` (optional)
