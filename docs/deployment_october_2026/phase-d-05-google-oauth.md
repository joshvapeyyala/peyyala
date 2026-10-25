# Phase D, step 5: Google sign-in for peyyala.com

## Why

The admin's "Sign in with Google" goes through an OAuth client in Google
Cloud. Google only lets a sign-in start from, and return to, addresses
listed on that client, and (in Testing mode) only lets listed test users in.

## The client

Google Cloud project **`peyyala`** > Google Auth Platform > Clients >
**Peyyala web** (Web application), client ID
`94152323391-qdpsudc14fhgv001bt96k3g7619c57gq.apps.googleusercontent.com`.
The laptop and the live site use the same client ID and secret.

| Setting | Values |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000`, `https://peyyala.com` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google`, `https://peyyala.com/api/auth/callback/google` |
| Publishing status | Testing |
| User type | External |
| Test users | `joshvapeyyala@gmail.com` (= `ADMIN_EMAIL`) |

No `www.peyyala.com` entries: www always redirects to peyyala.com first.

## Checked (2026-10-25)

Claude looked at the client in your Chrome: both live entries were
**already there** (added when the client was created), so nothing was
changed or saved. Audience: Testing, 1 test user, the same address as
`ADMIN_EMAIL` in `.env.local`.

Google Cloud Console now requires 2-step verification on the account:
turned on by you before this check.

## Notes

- Testing mode is fine for a single admin. Google may ask to re-consent
  more often than for a published app; sign-in itself works the same.
- Changes to the client can take 5 minutes to a few hours to take effect.
- The real test is in Phase E: signing in at `https://peyyala.com/admin`. A
  `redirect_uri_mismatch` error there would mean the redirect URI differs.
- The client secret can no longer be viewed in the console (only its last
  characters, `****a4_y`). It's in the laptop's `.env.local`; Phase E copies
  it to the server's `.env`. If it's ever lost: **Add secret** on the client,
  update both `.env` files, then disable the old one.

## Status

- [x] Live origin and redirect URI on the client
- [x] Admin account is a test user
- [x] 2-step verification on the Google account
- [x] Sign-in works on peyyala.com ([phase-e-05](phase-e-05-user-checks.md))
