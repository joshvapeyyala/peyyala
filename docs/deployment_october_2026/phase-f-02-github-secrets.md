# Phase F, step 2: Secrets in GitHub

## Why

The deploy workflow (F3) needs to log in to the server. GitHub keeps the
values encrypted and hands them only to workflow runs; nobody, the repo
owner included, can view them again after saving.

| Secret | Value | Where it came from |
|---|---|---|
| `DEPLOY_SSH_KEY` | private half of the deploy key (F1), the whole block from `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END …-----` | `C:\Users\J\.ssh\peyyala-github-deploy` |
| `DEPLOY_HOST` | `52.66.16.188` | the Elastic IP ([phase-b-05](phase-b-05-elastic-ip.md)) |
| `DEPLOY_KNOWN_HOSTS` | `52.66.16.188 ssh-ed25519 AAAA…` (one line) | the server's host key |

`DEPLOY_KNOWN_HOSTS` lets the workflow check it's talking to your server
(not an impostor) instead of trusting whatever answers. The host key's
fingerprint, `SHA256:Y74vQjKIpzjHJIYNVTGBnyRwE31s3O58CP5UAwQ+WOM`, was
checked three ways before use: fetched over the network, in the laptop's
`known_hosts` from the first login, and read on the server itself. All
matched.

## How it was done (2026-10-26)

Claude prepared a copy-from file with the three values (private key not
displayed; both keys' fingerprints verified inside it), readable only by
your Windows user. Claude isn't allowed to enter private keys into a
service, so you added the secrets yourself in the browser: repo > Settings >
Secrets and variables > Actions > New repository secret.

Checked with `gh secret list` (names and dates only):

```
DEPLOY_HOST          2026-10-25T19:42:10Z
DEPLOY_KNOWN_HOSTS   2026-10-25T19:42:51Z
DEPLOY_SSH_KEY       2026-10-25T19:41:31Z
```

That the key was pasted completely is proven by the first real run (F5).

To change one later: same page > the secret > **Update**; or from the
laptop, `gh secret set NAME --repo joshvapeyyala/peyyala`.

## Status

- [x] 3 secrets saved in GitHub
- [ ] Copy-from file `C:\Users\J\.ssh\github-secrets-peyyala.txt` deleted (you)
- [x] Values proven by a real run (F5, run 40228571971)
