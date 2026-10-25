#!/usr/bin/env bash
# Phase F, step 1: lets a CI deploy key (GitHub Actions) log in as the
# project user and run that project's deploy.sh, and nothing else. Safe to run
# again (the key's line is replaced, not duplicated).
#
#   sudo bash f1-deploy-key.sh <project> "<public key line>"
#   sudo bash f1-deploy-key.sh peyyala "ssh-ed25519 AAAA... github-actions deploy peyyala.com"
#
# The key is added to /home/<project>/.ssh/authorized_keys with:
#   restrict      no shell, no terminal, no port/agent/X11 forwarding
#   command="…"   whatever the client asks to run, deploy.sh runs instead
# So a leaked key can only redeploy the project's own main branch.
# Notes: docs/deployment_october_2026/phase-f-01-deploy-key.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ $# -eq 2 ]] || { echo "Usage: sudo bash f1-deploy-key.sh <project> \"<public key line>\"" >&2; exit 1; }
PROJECT=$1 KEY=$2
[[ $PROJECT =~ ^[a-z][a-z0-9-]*$ ]] || { echo "Unexpected project name." >&2; exit 1; }
[[ $KEY =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ .*)?$ ]] || { echo "Expected one ssh-ed25519 public key line." >&2; exit 1; }
id "$PROJECT" >/dev/null 2>&1 || { echo "User $PROJECT doesn't exist." >&2; exit 1; }

HOME_DIR=/home/$PROJECT
DEPLOY=/srv/$PROJECT/prod/deploy.sh
[[ -x $DEPLOY ]] || { echo "$DEPLOY is missing." >&2; exit 1; }
KEY_BODY=$(awk '{print $2}' <<<"$KEY")

install -d -o "$PROJECT" -g "$PROJECT" -m 700 "$HOME_DIR/.ssh"
FILE=$HOME_DIR/.ssh/authorized_keys
touch "$FILE"
tmp=$(mktemp)
# Every other key stays; this one is (re)written with its restrictions
grep -vF "$KEY_BODY" "$FILE" >"$tmp" || true
printf 'restrict,command="%s" %s\n' "$DEPLOY" "$KEY" >>"$tmp"
install -o "$PROJECT" -g "$PROJECT" -m 600 "$tmp" "$FILE"
rm -f "$tmp"

echo "✓ Deploy key installed for $PROJECT: it can only run $DEPLOY"
echo "  fingerprint: $(ssh-keygen -lf <(echo "$KEY") | awk '{print $2}')"
