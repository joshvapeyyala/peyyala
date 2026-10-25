#!/usr/bin/env bash
# Phase C, step 7: nightly database backups to S3 (shared by all projects).
# Run once per server; safe to run again (asks for the key again only with
# --reconfigure, or if it isn't set up yet).
#
#   sudo bash c7-backups.sh [--reconfigure]
#
# Every night at 02:30 (server time, IST) /usr/local/sbin/backup-databases
# dumps the database of every project with a /srv/<project>/prod/.env and
# uploads it to s3://joshua-peyyala-db-backups/<project>/<date_time>.dump with
# the shared-backup key, which may only add files (no list, read or delete).
# The bucket deletes copies after 30 days. healthchecks.io gets a ping per run
# and emails if a night fails or is missed.
# Notes: docs/deployment_october_2026/phase-c-07-backups.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
RECONFIGURE=false
[[ ${1:-} == --reconfigure ]] && RECONFIGURE=true

BUCKET=joshua-peyyala-db-backups
CONF=/etc/db-backups.conf
PROFILE=shared-backup

step() { printf '\n==> %s\n' "$*"; }

step "AWS CLI"
if ! command -v aws >/dev/null; then
  apt-get update -q
  apt-get -y -q install unzip curl
  tmp=$(mktemp -d)
  curl -fsSL -o "$tmp/awscliv2.zip" "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip"
  unzip -q "$tmp/awscliv2.zip" -d "$tmp"
  "$tmp/aws/install" >/dev/null
  rm -rf "$tmp"
fi
aws --version

step "Backup key and alert address"
if $RECONFIGURE || [[ ! -f /root/.aws/credentials || ! -f $CONF ]]; then
  read -rp "shared-backup Access key ID: " KEY_ID </dev/tty
  read -rsp "shared-backup Secret access key: " KEY_SECRET </dev/tty
  echo
  read -rp "healthchecks.io ping URL (Enter for none): " PING_URL </dev/tty
  [[ $KEY_ID =~ ^[A-Z0-9]{16,128}$ ]] || { echo "That doesn't look like an access key ID." >&2; exit 1; }
  [[ -n $KEY_SECRET ]] || { echo "No secret entered." >&2; exit 1; }
  [[ -z $PING_URL || $PING_URL =~ ^https://hc-ping\.com/[A-Za-z0-9/_-]+$ ]] || { echo "That doesn't look like a healthchecks.io ping URL." >&2; exit 1; }
  install -d -m 700 /root/.aws
  umask 077
  cat >/root/.aws/credentials <<EOF
[$PROFILE]
aws_access_key_id = $KEY_ID
aws_secret_access_key = $KEY_SECRET
EOF
  cat >/root/.aws/config <<EOF
[profile $PROFILE]
region = ap-south-1
EOF
  cat >"$CONF" <<EOF
# Read by /usr/local/sbin/backup-databases (written by c7-backups.sh)
BUCKET=$BUCKET
PROFILE=$PROFILE
PING_URL=$PING_URL
EOF
  umask 022
  chmod 600 /root/.aws/credentials /root/.aws/config "$CONF"
  unset KEY_SECRET
else
  echo "Already set up (run with --reconfigure to change them)."
fi

step "Backup program /usr/local/sbin/backup-databases"
cat >/usr/local/sbin/backup-databases <<'PROGRAM'
#!/usr/bin/env bash
# Dumps every project's database and uploads it to S3. Run nightly by
# backup-databases.timer; can be run by hand: sudo backup-databases
# Installed by scripts/server/c7-backups.sh.
set -uo pipefail
# shellcheck source=/dev/null
source /etc/db-backups.conf

# Tells healthchecks.io how the run went; never stops the backups if it can't
ping() { if [[ -n ${PING_URL:-} ]]; then curl -fsS -m 10 --retry 3 -o /dev/null "$PING_URL$1" || true; fi; }
ping /start

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
stamp=$(date +%Y-%m-%d_%H%M)
failed=()
done_count=0

for env_file in /srv/*/prod/.env; do
  [[ -f $env_file ]] || continue
  project=$(basename "$(dirname "$(dirname "$env_file")")")
  url=$(grep -m 1 '^DATABASE_URL=' "$env_file" | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']\$//")
  # postgres://user:password@host:port/database?sslmode=...&sslrootcert=...
  if [[ ! $url =~ ^postgres(ql)?://([^:]+):([^@]+)@([^:/]+):([0-9]+)/([^?]+)(\?(.*))?$ ]]; then
    echo "$project: DATABASE_URL not understood, skipped"
    failed+=("$project")
    continue
  fi
  user=${BASH_REMATCH[2]} password=${BASH_REMATCH[3]} host=${BASH_REMATCH[4]} port=${BASH_REMATCH[5]} database=${BASH_REMATCH[6]} query=${BASH_REMATCH[8]:-}
  sslmode=$(sed -n 's/.*\(^\|&\)sslmode=\([^&]*\).*/\2/p' <<<"$query")
  sslrootcert=$(sed -n 's/.*\(^\|&\)sslrootcert=\([^&]*\).*/\2/p' <<<"$query")
  file=$work/$project.dump
  key=$project/$stamp.dump
  # Connection details through the environment, not the command line, where
  # other users' processes could read the password
  if PGHOST=$host PGPORT=$port PGUSER=$user PGPASSWORD=$password PGDATABASE=$database \
     PGSSLMODE=${sslmode:-verify-full} PGSSLROOTCERT=${sslrootcert:-/srv/shared/rds-ca.pem} \
     pg_dump --format=custom --no-owner --file="$file" &&
     aws s3 cp --only-show-errors --profile "$PROFILE" "$file" "s3://$BUCKET/$key"; then
    echo "$project: uploaded $key ($(du -h "$file" | cut -f1))"
    done_count=$((done_count + 1))
  else
    echo "$project: FAILED"
    failed+=("$project")
  fi
  rm -f "$file"
done

if ((${#failed[@]})); then
  echo "Backups failed for: ${failed[*]}"
  ping /fail
  exit 1
fi
echo "All $done_count database(s) backed up."
ping ""
PROGRAM
chmod 700 /usr/local/sbin/backup-databases

step "Nightly timer (02:30)"
cat >/etc/systemd/system/backup-databases.service <<'EOF'
[Unit]
Description=Back up every project's database to S3
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/backup-databases
EOF
cat >/etc/systemd/system/backup-databases.timer <<'EOF'
[Unit]
Description=Nightly database backups

[Timer]
OnCalendar=*-*-* 02:30:00
# If the server was off at 02:30, run soon after it starts
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now backup-databases.timer >/dev/null

step "Done"
systemctl list-timers backup-databases.timer --no-pager | head -n 2
