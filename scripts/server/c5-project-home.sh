#!/usr/bin/env bash
# Phase C, step 5: a project's home on the server. Run once per project;
# safe to run again.
#
#   sudo bash c5-project-home.sh <project> <github-owner/repo>
#   sudo bash c5-project-home.sh peyyala joshvapeyyala/peyyala
#
# - Linux user <project>: no password, no admin rights; the site runs as it
# - /srv/<project>/prod with releases/ and backups/, private to that user
# - PM2 for that user: starts at boot, logs rotated daily, 14 days kept
# - the first copy of the repo's scripts/deploy.sh (from main); after that
#   the deploy script keeps its own copy up to date
# Notes: docs/deployment_october_2026/phase-c-05-project-home.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ $# -eq 2 ]] || { echo "Usage: sudo bash c5-project-home.sh <project> <github-owner/repo>" >&2; exit 1; }
PROJECT=$1 REPO=$2
[[ $PROJECT =~ ^[a-z][a-z0-9-]*$ && $REPO =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || { echo "Unexpected characters in the arguments." >&2; exit 1; }

HOME_DIR=/home/$PROJECT
BASE=/srv/$PROJECT/prod

step() { printf '\n==> %s\n' "$*"; }
# Runs a command as the project user, in a login shell (its own HOME and PATH)
as_project() { sudo -u "$PROJECT" -H -i -- "$@"; }

step "User $PROJECT"
if ! id "$PROJECT" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$PROJECT"
fi
# No password at all: only reachable through sudo -iu from the admin login
passwd -l "$PROJECT" >/dev/null
chmod 750 "$HOME_DIR"

step "Folders under /srv/$PROJECT"
install -d -o "$PROJECT" -g "$PROJECT" -m 750 "/srv/$PROJECT" "$BASE" "$BASE/releases"
# Database copies: the whole site's data
install -d -o "$PROJECT" -g "$PROJECT" -m 700 "$BASE/backups"

step "deploy.sh (first copy, from $REPO main)"
if [[ ! -f $BASE/deploy.sh ]]; then
  curl -fsSL -o "$BASE/deploy.sh.new" "https://raw.githubusercontent.com/$REPO/main/scripts/deploy.sh"
  head -n 1 "$BASE/deploy.sh.new" | grep -q '^#!/usr/bin/env bash' || { rm -f "$BASE/deploy.sh.new"; echo "Downloaded deploy.sh doesn't look like the script." >&2; exit 1; }
  mv -f "$BASE/deploy.sh.new" "$BASE/deploy.sh"
fi
chown "$PROJECT:$PROJECT" "$BASE/deploy.sh"
chmod 700 "$BASE/deploy.sh"

step "PM2 for $PROJECT: start at boot"
# Writes and enables the systemd service pm2-<project>
pm2 startup systemd -u "$PROJECT" --hp "$HOME_DIR" >/dev/null
systemctl enable "pm2-$PROJECT" >/dev/null
systemctl start "pm2-$PROJECT"

step "PM2 for $PROJECT: log rotation (daily, 14 kept, compressed, 50 MB cap)"
if ! as_project pm2 jlist 2>/dev/null | grep -q '"name":"pm2-logrotate"'; then
  as_project pm2 install pm2-logrotate >/dev/null
fi
as_project pm2 set pm2-logrotate:retain 14 >/dev/null
as_project pm2 set pm2-logrotate:compress true >/dev/null
as_project pm2 set pm2-logrotate:rotateInterval '0 0 * * *' >/dev/null
as_project pm2 set pm2-logrotate:max_size 50M >/dev/null
as_project pm2 save >/dev/null

step "Done"
echo "user $PROJECT, $BASE, pm2-$PROJECT $(systemctl is-enabled "pm2-$PROJECT")/$(systemctl is-active "pm2-$PROJECT")"
