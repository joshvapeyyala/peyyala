#!/usr/bin/env bash
# Phase C, step 2: what the sites run and build with (shared by all
# projects). Safe to run again.
#
#   sudo bash c2-site-tools.sh
#
# Node.js 22 from NodeSource (Ubuntu's own is a different version), pnpm via
# corepack (each project's package.json picks its exact pnpm version), PM2
# and git. Notes: docs/deployment_october_2026/phase-c-02-site-tools.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

NODE_MAJOR=22   # same as the laptop; supported until April 2027

step() { printf '\n==> %s\n' "$*"; }

step "Basics: git, curl, gpg"
apt-get update -q
apt-get -y -q install git curl ca-certificates gnupg

step "Node.js $NODE_MAJOR (NodeSource)"
install -d -m 755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" >/etc/apt/sources.list.d/nodesource.list
# Always take nodejs from NodeSource, never Ubuntu's own package
cat >/etc/apt/preferences.d/nodesource <<'EOF'
Package: nodejs
Pin: origin deb.nodesource.com
Pin-Priority: 600
EOF
apt-get update -q
apt-get -y -q install nodejs

step "pnpm (corepack)"
corepack enable
# Scripts and deploys run without a terminal: fetch the pnpm version a
# project asks for without asking first
grep -q '^COREPACK_ENABLE_DOWNLOAD_PROMPT=' /etc/environment || echo 'COREPACK_ENABLE_DOWNLOAD_PROMPT=0' >>/etc/environment

step "PM2"
npm install -g --no-fund --no-audit pm2@6 >/dev/null

step "Done"
echo "node $(node -v), npm $(npm -v), corepack $(corepack --version), pm2 $(pm2 -v 2>/dev/null | tail -n 1), $(git --version)"
