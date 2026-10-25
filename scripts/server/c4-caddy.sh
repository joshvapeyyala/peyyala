#!/usr/bin/env bash
# Phase C, step 4: Caddy, the web server in front of every site. It gets and
# renews HTTPS certificates by itself and passes visitors to each site's port.
# Safe to run again; run once per project to add its site.
#
#   sudo bash c4-caddy.sh <project> <domain> <port>
#   sudo bash c4-caddy.sh peyyala peyyala.com 3001
#
# The domain must already point at this server (DNS), or the certificate
# can't be issued. www.<domain> redirects to <domain>, http to https. While
# the site isn't running (before the first deploy, or if it's down), visitors
# get a short "back soon" page instead of an error.
# Notes: docs/deployment_october_2026/phase-c-04-caddy.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
[[ $# -eq 3 ]] || { echo "Usage: sudo bash c4-caddy.sh <project> <domain> <port>" >&2; exit 1; }
PROJECT=$1 DOMAIN=$2 PORT=$3
[[ $PROJECT =~ ^[a-z0-9-]+$ && $DOMAIN =~ ^[a-z0-9.-]+$ && $PORT =~ ^[0-9]+$ ]] || { echo "Unexpected characters in the arguments." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

step() { printf '\n==> %s\n' "$*"; }

step "Caddy (official packages)"
if ! command -v caddy >/dev/null; then
  apt-get update -q
  apt-get -y -q install curl gnupg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt -o /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q
  apt-get -y -q install caddy
fi

step "Main config: one file per site in /etc/caddy/sites/"
install -d -m 755 /etc/caddy/sites
cat >/etc/caddy/Caddyfile <<'EOF'
# Written by scripts/server/c4-caddy.sh. Each site is its own file in
# /etc/caddy/sites/; this file only loads them.
import /etc/caddy/sites/*.caddy
EOF

step "\"Back soon\" page"
install -d -m 755 /srv/shared/back-soon
cat >/srv/shared/back-soon/index.html <<'EOF'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Back soon</title>
<style>
  :root { color-scheme: light dark; --bg: #f7f7f5; --fg: #1d1d1b; --muted: #6b6b66; }
  @media (prefers-color-scheme: dark) { :root { --bg: #151514; --fg: #ededea; --muted: #9a9a94; } }
  html, body { height: 100%; margin: 0; }
  body { display: grid; place-items: center; background: var(--bg); color: var(--fg);
         font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 0 16px; }
  main { max-width: 32rem; text-align: center; }
  h1 { font-size: 1.75rem; margin: 0 0 .5rem; letter-spacing: -.01em; }
  p { margin: 0; color: var(--muted); }
</style>
</head>
<body>
<main>
  <h1>This site will be back soon</h1>
  <p>It's being set up or updated. Please check again in a little while.</p>
</main>
</body>
</html>
EOF
chmod 644 /srv/shared/back-soon/index.html

step "Site: $DOMAIN -> 127.0.0.1:$PORT"
cat >"/etc/caddy/sites/$PROJECT.caddy" <<EOF
# $PROJECT, written by scripts/server/c4-caddy.sh
$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:$PORT
	# The site isn't running (not deployed yet, restarting, or down)
	handle_errors 502 503 504 {
		root * /srv/shared/back-soon
		rewrite * /index.html
		header Cache-Control "no-store"
		file_server
	}
	log {
		output file /var/log/caddy/$PROJECT.log {
			roll_size 20MiB
			roll_keep 10
		}
	}
}

www.$DOMAIN {
	redir https://$DOMAIN{uri} permanent
}
EOF

step "Checking the config and reloading"
# As the caddy user: checking opens the log files, and a file root creates
# here would be one the caddy service can't write to
chown -R caddy:caddy /var/log/caddy
sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 ||
  { sudo -u caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; exit 1; }
systemctl enable caddy >/dev/null
if systemctl is-active --quiet caddy; then systemctl reload caddy; else systemctl start caddy; fi

step "Done"
echo "$(caddy version | awk '{print "caddy", $1}'), sites: $(cd /etc/caddy/sites && printf '%s ' *.caddy)"
