#!/usr/bin/env bash
# Puts the latest code from main live, or goes back to the previous release.
# Runs on the server, as the project's user (peyyala):
#
#   deploy.sh            deploy the latest main
#   deploy.sh rollback   switch back to the previous release
#
# Each deploy gets its own folder in releases/; "current" points at the live
# one. Until the switch (step 8) visitors see the old release, so any earlier
# failure leaves the site untouched. After the switch, a failed health check
# switches straight back. Rollback can't undo migrations: see
# docs/deployment_october_2026/05-migrations.md for the rule they follow.
#
# The server keeps its own copy at $BASE/deploy.sh and replaces it from each
# release that goes live. Full notes: docs/deployment_october_2026/06-deploy-script.md
#
# Listing with ls is fine here: this script names every release and backup
# itself (date_commit), so there are no spaces or odd characters.
# shellcheck disable=SC2012
set -Eeuo pipefail

# --- This project. For another project, copy the file and change these. ---
APP=peyyala-prod                                      # PM2 process name
BASE=${DEPLOY_BASE:-/srv/peyyala/prod}                # releases/, current, .env, backups/
REPO=${DEPLOY_REPO:-https://github.com/joshvapeyyala/peyyala.git}
BRANCH=${DEPLOY_BRANCH:-main}
PORT=${DEPLOY_PORT:-3001}                             # must match ecosystem.config.cjs
KEEP_RELEASES=3
KEEP_BACKUPS=5
HEALTH_WAIT=60                                        # seconds to wait for a healthy start
# ----------------------------------------------------------------------------

RELEASES=$BASE/releases
CURRENT=$BASE/current
BACKUPS=$BASE/backups
ENV_FILE=$BASE/.env

# A release that isn't live yet: deleted if the deploy stops before the switch
DISCARD=""

step() { printf '\n==> %s\n' "$*"; }
fail() {
  printf '\n✗ %s\n' "$*" >&2
  [[ -z $DISCARD ]] || rm -rf "$DISCARD"
  exit 1
}
# Any failing command stops the script. Reported once, by the script itself,
# not again by each ( ... ) step it ran in.
on_error() {
  ((BASH_SUBSHELL == 0)) || return 0
  printf '\n✗ Stopped: "%s" failed (line %s).%s\n' "$1" "$2" "${DISCARD:+ The live site was not changed.}" >&2
  [[ -z $DISCARD ]] || rm -rf "$DISCARD"
}
trap 'on_error "$BASH_COMMAND" "$LINENO"' ERR

# The release folder "current" points at, or nothing before the first deploy
live_release() { if [[ -L $CURRENT ]]; then readlink -f "$CURRENT"; fi; }

# Points "current" at a release in one step: visitors never see it half-switched
point_current_at() {
  ln -sfn "$1" "$CURRENT.next"
  mv -Tf "$CURRENT.next" "$CURRENT"
}

# Starts the app from "current", or restarts it (a few seconds of downtime)
restart_app() {
  pm2 startOrRestart "$CURRENT/ecosystem.config.cjs" --update-env >/dev/null
  pm2 save >/dev/null
}

# Waits until /api/health says ok for the given commit
healthy() {
  local commit=$1 answer=""
  for ((i = 0; i < HEALTH_WAIT; i += 2)); do
    # Not -f: a 503's body says what's wrong
    answer=$(curl -sS --max-time 5 "http://127.0.0.1:$PORT/api/health" 2>/dev/null || true)
    if [[ $answer == *'"ok":true'* && $answer == *"\"commit\":\"$commit\""* ]]; then
      echo "Healthy: $answer"
      return 0
    fi
    sleep 2
  done
  echo "Not healthy after ${HEALTH_WAIT}s. Last answer: ${answer:-none}" >&2
  return 1
}

commit_of() { cat "$1/.commit" 2>/dev/null || echo unknown; }

deploy() {
  local previous release commit name pending
  previous=$(live_release)

  step "1/10 Downloading $BRANCH"
  local incoming=$RELEASES/.incoming
  rm -rf "$incoming"
  git clone --quiet --depth 1 --branch "$BRANCH" "$REPO" "$incoming"
  commit=$(git -C "$incoming" rev-parse --short HEAD)
  name="$(date +%Y-%m-%d_%H%M%S)_$commit"
  release=$RELEASES/$name
  mv "$incoming" "$release"
  echo "$commit" >"$release/.commit"
  echo "Release $name"
  DISCARD=$release

  step "2/10 Installing packages"
  (cd "$release" && pnpm install --frozen-lockfile --reporter=silent)

  step "3/10 Linking settings"
  ln -s "$ENV_FILE" "$release/.env.local"

  step "4/10 Checking for migrations"
  local url
  url=$(grep -m 1 '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']\$//")
  pending=$(cd "$release" && pnpm --silent db:migrate --pending | tail -n 1)
  [[ $pending =~ ^[0-9]+$ ]] || fail "Couldn't count pending migrations (got: $pending)."
  echo "$pending pending"

  if ((pending > 0)); then
    step "5/10 Saving a copy of the database first"
    local backup
    backup=$BACKUPS/$(date +%Y-%m-%d_%H%M%S)_before_$commit.dump
    (umask 077 && pg_dump --format=custom --no-owner --file="$backup" "$url")
    echo "Saved $(du -h "$backup" | cut -f1) to $backup"
    ls -1t "$BACKUPS"/*.dump | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm --
  else
    step "5/10 No migrations, no copy needed"
  fi

  step "6/10 Migrating"
  (cd "$release" && pnpm --silent db:migrate)
  # First deploy only: the build prerenders from the database, so it needs
  # the starting content. Never runs once there's a profile.
  if [[ $(psql "$url" -tAc "select count(*) from profile") == 0 ]]; then
    echo "The database is empty: loading the starting content (first deploy)"
    (cd "$release" && pnpm --silent db:seed)
  fi

  step "7/10 Building"
  if [[ -n $previous && -d $previous/.next/cache ]]; then
    mkdir -p "$release/.next"
    cp -a "$previous/.next/cache" "$release/.next/cache"
  fi
  (cd "$release" && pnpm --silent build)

  step "8/10 Going live"
  DISCARD=""
  point_current_at "$release"
  restart_app

  step "9/10 Health check"
  if ! healthy "$commit"; then
    if [[ -n $previous ]]; then
      echo "Switching back to $(basename "$previous")" >&2
      point_current_at "$previous"
      restart_app
      healthy "$(commit_of "$previous")" || echo "The previous release isn't healthy either. Check: pm2 logs $APP" >&2
    fi
    rm -rf "$release"
    fail "Release $name failed its health check and was removed. See: pm2 logs $APP"
  fi

  step "10/10 Tidying up"
  # Newest first by name (names start with the date); never the live one
  ls -1 "$RELEASES" | sort -r | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
    [[ $RELEASES/$old == "$release" ]] || rm -rf "${RELEASES:?}/$old"
  done
  # This script's own copy, from the release now live. A new file, not an
  # overwrite, so the run in progress keeps reading the old one.
  cp "$release/scripts/deploy.sh" "$BASE/deploy.sh.next"
  chmod +x "$BASE/deploy.sh.next"
  mv -f "$BASE/deploy.sh.next" "$BASE/deploy.sh"

  printf '\n✓ Live: %s (commit %s)\n' "$name" "$commit"
}

rollback() {
  local live target
  live=$(live_release)
  [[ -n $live ]] || fail "Nothing is live yet."
  # The release just older than the live one
  target=$(ls -1 "$RELEASES" | sort | awk -v live="$(basename "$live")" '$0 == live { print prev } { prev = $0 }')
  [[ -n $target ]] || fail "There's no release older than $(basename "$live") to go back to."

  step "Switching back from $(basename "$live") to $target"
  echo "Note: the database stays as it is (migrations aren't undone)."
  point_current_at "$RELEASES/$target"
  restart_app

  step "Health check"
  healthy "$(commit_of "$RELEASES/$target")" || fail "$target isn't healthy. Check: pm2 logs $APP"
  printf '\n✓ Live: %s\n' "$target"
}

main() {
  [[ -f $ENV_FILE ]] || fail "$ENV_FILE is missing. Create it first (see the deploy doc)."
  mkdir -p "$RELEASES" "$BACKUPS"
  # Database copies hold all the site's data: readable by this user only
  chmod 700 "$BACKUPS"
  # One deploy or rollback at a time
  exec 9>"$BASE/.deploy.lock"
  flock -n 9 || fail "Another deploy or rollback is running. Try again when it's finished."

  case "${1:-deploy}" in
    deploy) deploy ;;
    rollback) rollback ;;
    *) fail "Unknown command \"$1\". Use: deploy.sh [deploy|rollback]" ;;
  esac
}

main "$@"
