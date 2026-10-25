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

Brevo > Settings > Security > Authorized IPs: blocking of unknown addresses
is **off** for API keys, so the laptop and the server can both send. Nothing
changed.

## Worth knowing

- **Full access:** with the default permissions, anyone holding
  `peyyala-prod` could use the whole Brevo account (contacts, campaigns,
  other senders), not only send email. It lives in a file only the `peyyala`
  user can read. If Brevo offers narrower permissions when editing a key,
  "send transactional emails" alone is enough for this site.
- **Tightening later (optional, Phase G):** switch on IP blocking for API
  keys and authorize only the server (`52.66.16.188`). The laptop key would
  then stop working, which is fine once testing is over.
- **If a key leaks:** delete it in Brevo, generate a new one, update the
  `.env` that used it, and restart (`deploy.sh` or `pm2 restart`).

## Status

- [x] `peyyala-prod` created and saved (no expiry)
- [x] `peyyala-local-test` created and saved (no expiry)
- [x] Authorized IPs: blocking off, nothing to add
- [ ] After D4: delete `peyyala-local-test` (optional)
