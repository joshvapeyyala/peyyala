#!/usr/bin/env bash
# Phase C, step 6: a project's database, its own login, and the start of its
# production .env. Run once per project; safe to run again.
#
#   sudo bash c6-project-database.sh <project> <rds-endpoint> <domain>
#   sudo bash c6-project-database.sh peyyala shared-db-1.xxxx.ap-south-1.rds.amazonaws.com peyyala.com
#
# Asks for the RDS master password (shared_admin) once, uses it only to
# create the database <project>_prod and the login <project>_prod, and
# doesn't store it. The login's password is generated here and written
# straight into /srv/<project>/prod/.env (readable by the project user only):
# nobody needs to see it. Settings that come from elsewhere (Google, S3 key,
# Brevo) are left blank for Phase E.
# Notes: docs/deployment_october_2026/phase-c-06-project-database.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ $# -eq 3 ]] || { echo "Usage: sudo bash c6-project-database.sh <project> <rds-endpoint> <domain>" >&2; exit 1; }
PROJECT=$1 RDS_HOST=$2 DOMAIN=$3
[[ $PROJECT =~ ^[a-z][a-z0-9-]*$ && $RDS_HOST =~ ^[a-z0-9.-]+$ && $DOMAIN =~ ^[a-z0-9.-]+$ ]] || { echo "Unexpected characters in the arguments." >&2; exit 1; }
id "$PROJECT" >/dev/null 2>&1 || { echo "User $PROJECT doesn't exist: run c5-project-home.sh first." >&2; exit 1; }

NAME=${PROJECT//-/_}_prod          # database and login, e.g. peyyala_prod
MASTER_USER=shared_admin
RDS_CA=/srv/shared/rds-ca.pem
ENV_FILE=/srv/$PROJECT/prod/.env

step() { printf '\n==> %s\n' "$*"; }

# Connects as the project's login, with the password from the environment
# rather than the command line (where other processes could see it)
project_psql() {
  sudo -u "$PROJECT" env PGHOST="$RDS_HOST" PGPORT=5432 PGDATABASE="$NAME" PGUSER="$NAME" PGPASSWORD="$1" \
    PGSSLMODE=verify-full PGSSLROOTCERT="$RDS_CA" PGCONNECT_TIMEOUT=10 psql -X -w -qtA -c "${2:-select 1}"
}
url_password() { grep -m 1 '^DATABASE_URL=' "$ENV_FILE" | sed -E 's#^DATABASE_URL="?postgres://[^:]+:([^@]+)@.*#\1#'; }

if [[ -f $ENV_FILE ]] && project_psql "$(url_password)" >/dev/null 2>&1; then
  step "Already set up: $NAME connects with the password in $ENV_FILE. Nothing to do."
  exit 0
fi

step "RDS master password"
read -rsp "RDS master password for $MASTER_USER: " MASTER_PW </dev/tty
echo
[[ -n $MASTER_PW ]] || { echo "No password entered." >&2; exit 1; }

# Letters and digits only, so it never needs escaping in DATABASE_URL
DB_PW=$(openssl rand -hex 24)

step "Database $NAME and login $NAME"
# The SQL, password included, goes in on stdin, not the command line
PGPASSWORD=$MASTER_PW psql -X -w -q -v ON_ERROR_STOP=1 \
  "host=$RDS_HOST port=5432 dbname=postgres user=$MASTER_USER sslmode=verify-full sslrootcert=$RDS_CA connect_timeout=10" <<SQL
\set name '$NAME'
\set pw '$DB_PW'
SELECT format('CREATE ROLE %I LOGIN', :'name') WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'name') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'name', :'pw') \gexec
-- The master user must be a member to create a database owned by it
SELECT format('GRANT %I TO CURRENT_USER', :'name') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'name', :'name') WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'name') \gexec
-- Only its own login (and the master user) may open it
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'name') \gexec
SELECT format('GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I', :'name', :'name') \gexec
-- No project login may open the default database to look around. Not fatal:
-- the check afterwards shows whether it took effect
\set ON_ERROR_STOP 0
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
SQL
unset MASTER_PW

DATABASE_URL="postgres://$NAME:$DB_PW@$RDS_HOST:5432/$NAME?sslmode=verify-full&sslrootcert=$RDS_CA"

step "Settings file $ENV_FILE"
if [[ -f $ENV_FILE ]]; then
  # Keep everything else; only the database password changed
  tmp=$(mktemp)
  awk -v line="DATABASE_URL=\"$DATABASE_URL\"" '/^DATABASE_URL=/ { print line; next } { print }' "$ENV_FILE" >"$tmp"
  install -o "$PROJECT" -g "$PROJECT" -m 600 "$tmp" "$ENV_FILE"
  rm -f "$tmp"
  echo "Existing file kept; DATABASE_URL updated."
else
  AUTH_SECRET=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n')
  tmp=$(mktemp)
  cat >"$tmp" <<EOF
# Production settings for $PROJECT. Readable by the $PROJECT user only.
# Started by scripts/server/c6-project-database.sh; blanks are filled in
# Phase E (docs/deployment_october_2026/README.md, "The production .env").

# Database: this project's own login, encrypted and verified
DATABASE_URL="$DATABASE_URL"

# Sign-in (generated here; different from the laptop's)
BETTER_AUTH_SECRET=$AUTH_SECRET
BETTER_AUTH_URL=https://$DOMAIN
# Phase E: Google Cloud Console > Credentials > the OAuth client
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Phase E: the only Google account allowed into the admin
ADMIN_EMAIL=

# Uploads
S3_BUCKET=joshua-portfolio-prod
S3_REGION=ap-south-1
# Phase E: the joshua-portfolio-prod-app user's access key
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
STORAGE_PUBLIC_URL=https://joshua-portfolio-prod.s3.ap-south-1.amazonaws.com

# Email
MAIL_DRIVER=brevo
MAIL_TO=
# Phase D/E: Brevo sender and the peyyala-prod API key
MAIL_FROM=
BREVO_API_KEY=

# Caddy is the only proxy in front of the site
TRUSTED_PROXIES=1
EOF
  install -o "$PROJECT" -g "$PROJECT" -m 600 "$tmp" "$ENV_FILE"
  rm -f "$tmp"
fi

step "Checking the new login"
project_psql "$DB_PW" "select 'connected as ' || current_user || ' to ' || current_database() || ', ssl=' || ssl || ' ' || version from pg_stat_ssl where pid = pg_backend_pid()"

step "Done"
