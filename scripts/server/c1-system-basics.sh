#!/usr/bin/env bash
# Phase C, step 1: system basics for a fresh Ubuntu server (shared by all
# projects). Safe to run again: it only changes what isn't in place yet.
#
#   sudo bash c1-system-basics.sh
#
# Updates, automatic security updates (no automatic reboots), time zone IST,
# a 4 GB swap file, and fail2ban for SSH.
# Notes: docs/deployment_october_2026/phase-c-01-system-basics.md
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
export DEBIAN_FRONTEND=noninteractive

step() { printf '\n==> %s\n' "$*"; }

step "Installing updates"
apt-get update -q
# Keep existing config files if a package ships a new version of one
apt-get -y -q -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold full-upgrade
apt-get -y -q install unattended-upgrades fail2ban
apt-get -y -q autoremove

step "Automatic security updates"
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
# Never reboot by itself: a reboot restarts every site. /var/run/reboot-required
# says when one is due.
cat >/etc/apt/apt.conf.d/52unattended-upgrades-local <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF
systemctl enable --now unattended-upgrades >/dev/null

step "Time zone: India"
timedatectl set-timezone Asia/Kolkata

step "Swap file (4 GB)"
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
  [[ -f /swapfile ]] || fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
# Use RAM first; swap is for build peaks
echo 'vm.swappiness=10' >/etc/sysctl.d/90-swappiness.conf
sysctl -q -p /etc/sysctl.d/90-swappiness.conf

step "fail2ban for SSH"
# Ubuntu logs SSH to the systemd journal, so read it from there
cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
backend = systemd

[sshd]
enabled  = true
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable fail2ban >/dev/null
systemctl restart fail2ban

step "Done"
if [[ -f /var/run/reboot-required ]]; then
  echo "A reboot is needed to finish the updates (sudo reboot)."
else
  echo "No reboot needed."
fi
