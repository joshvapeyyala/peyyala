#!/usr/bin/env bash
# Phase C, step 3: database tools (shared by all projects). Safe to run again.
#
#   sudo bash c3-database-tools.sh
#
# PostgreSQL client tools (psql, pg_dump, pg_restore) from the PostgreSQL
# project's own packages, in the same major version as RDS (shared-db-1 runs
# 18) and the laptop's Docker: pg_dump refuses a newer server, and an older
# pg_restore can't read a newer pg_dump's files. Other client versions are
# removed, so psql and pg_dump always mean this one.
# Plus Amazon's RDS certificate bundle, for sslmode=verify-full.
# Notes: docs/deployment_october_2026/phase-c-03-database-tools.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

PG_MAJOR=18   # = shared-db-1's major version (SHOW server_version)
RDS_CA=/srv/shared/rds-ca.pem

step() { printf '\n==> %s\n' "$*"; }

step "PostgreSQL $PG_MAJOR client (apt.postgresql.org)"
apt-get update -q
apt-get -y -q install postgresql-common
# Adds the PostgreSQL project's package source and its signing key
/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y >/dev/null
apt-get -y -q install "postgresql-client-$PG_MAJOR"
mapfile -t others < <(dpkg-query -W -f '${Package} ${Status}\n' 'postgresql-client-[0-9]*' 2>/dev/null |
  awk -v keep="postgresql-client-$PG_MAJOR" '$1 != keep && / installed$/ { print $1 }')
if ((${#others[@]})); then
  echo "Removing other client versions: ${others[*]}"
  apt-get -y -q purge "${others[@]}"
fi

step "Amazon RDS certificate bundle"
install -d -m 755 /srv/shared
# Global bundle: every region, so it serves any project's database
curl -fsSL -o "$RDS_CA.new" https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
grep -q "BEGIN CERTIFICATE" "$RDS_CA.new" || { rm -f "$RDS_CA.new"; echo "Downloaded file isn't a certificate bundle." >&2; exit 1; }
mv -f "$RDS_CA.new" "$RDS_CA"
chmod 644 "$RDS_CA"

step "Done"
echo "$(psql --version), $(pg_dump --version | awk '{print $1, $NF}'), $(grep -c 'BEGIN CERTIFICATE' "$RDS_CA") certificates in $RDS_CA"
