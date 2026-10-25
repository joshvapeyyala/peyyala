#!/usr/bin/env bash
# Sets values in a project's production .env without them appearing on screen,
# in the shell history or on a command line. Safe to run again (it replaces).
#
#   sudo bash env-set.sh <project> NAME [NAME...]       asks for each value
#   sudo bash env-set.sh <project> NAME=value            sets a non-secret value
#
#   sudo bash env-set.sh peyyala GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET ADMIN_EMAIL
#
# Names containing SECRET, KEY or PASSWORD are asked for without echoing. Known
# names are checked for the right shape before anything is written. The file
# stays readable by the project user only. Restart the site afterwards (a
# deploy does): the running site read the old values when it started.
# Notes: docs/deployment_october_2026/phase-e-01-env.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ $# -ge 2 ]] || { echo "Usage: sudo bash env-set.sh <project> NAME[=value] [...]" >&2; exit 1; }
PROJECT=$1
shift
[[ $PROJECT =~ ^[a-z][a-z0-9-]*$ ]] || { echo "Unexpected project name." >&2; exit 1; }
ENV_FILE=/srv/$PROJECT/prod/.env
[[ -f $ENV_FILE ]] || { echo "$ENV_FILE doesn't exist: run c6-project-database.sh first." >&2; exit 1; }

# The shape each known setting must have; others are accepted as they are
check() {
  local name=$1 value=$2
  case $name in
    GOOGLE_CLIENT_ID) [[ $value =~ ^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$ ]] ;;
    GOOGLE_CLIENT_SECRET) [[ $value =~ ^GOCSPX-[A-Za-z0-9_-]{20,}$ ]] ;;
    ADMIN_EMAIL | MAIL_TO) [[ $value =~ ^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$ ]] ;;
    S3_ACCESS_KEY_ID) [[ $value =~ ^AKIA[A-Z0-9]{16}$ ]] ;;
    S3_SECRET_ACCESS_KEY) [[ $value =~ ^[A-Za-z0-9/+]{40}$ ]] ;;
    BREVO_API_KEY) [[ $value =~ ^xkeysib-[A-Za-z0-9-]{20,}$ ]] ;;
    *) [[ -n $value ]] ;;
  esac
}

# Double-quoted for the .env format, with $ escaped so Next.js doesn't read it
# as a variable. Next.js doesn't undo escaped " or \, so values containing
# those are refused (no real key or address contains them).
quote() { printf '"%s"' "${1//\$/\\\$}"; }

for arg in "$@"; do
  if [[ $arg == *=* ]]; then
    name=${arg%%=*} value=${arg#*=}
  else
    name=$arg
    if [[ $name =~ SECRET|KEY|PASSWORD ]]; then
      read -rsp "$name (hidden): " value </dev/tty
      echo
    else
      read -rp "$name: " value </dev/tty
    fi
  fi
  [[ $name =~ ^[A-Z][A-Z0-9_]*$ ]] || { echo "Not a setting name: $name" >&2; exit 1; }
  if [[ $value == *\"* || $value == *\\* ]] || ! check "$name" "$value"; then
    echo "✗ $name: that doesn't look right (nothing written). Run again for this one." >&2
    exit 1
  fi
  tmp=$(mktemp)
  line="$name=$(quote "$value")"
  # Replace the existing line, or add one at the end
  if grep -q "^$name=" "$ENV_FILE"; then
    LINE=$line awk -v name="$name" 'index($0, name "=") == 1 { print ENVIRON["LINE"]; next } { print }' "$ENV_FILE" >"$tmp"
  else
    cat "$ENV_FILE" >"$tmp"
    printf '%s\n' "$line" >>"$tmp"
  fi
  install -o "$PROJECT" -g "$PROJECT" -m 600 "$tmp" "$ENV_FILE"
  rm -f "$tmp"
  unset value line
  echo "✓ $name set"
done
