// PM2's instructions for running the live site on the server: what to run,
// from where, and with which limits. scripts/deploy.sh restarts it after each
// deploy. Notes: docs/deployment_october_2026/07-pm2-config.md
//
//   pm2 logs peyyala-prod       what the site prints, errors included
//   pm2 describe peyyala-prod   status, restarts, memory
module.exports = {
  apps: [
    {
      name: "peyyala-prod",
      // Always the live release: a restart picks up whatever "current" points at
      cwd: "/srv/peyyala/prod/current",
      script: "node_modules/next/dist/bin/next",
      // Port 3001 must match PORT in scripts/deploy.sh and the Caddy site.
      // 127.0.0.1: reachable only from the server itself, so only through Caddy.
      args: "start --port 3001 --hostname 127.0.0.1",
      // Exactly one copy. Next.js keeps its page cache in memory, and an admin
      // save (updateTag) refreshes only the copy that handled it: a second
      // copy would keep serving stale pages.
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production" },
      // Normally 200–400 MB. Above this something is wrong (a leak), so
      // restart rather than slow down the other projects on the server.
      max_memory_restart: "1G",
      // On stop or restart, give open requests 5 seconds to finish
      kill_timeout: 5000,
      // Crashing again and again: wait longer between restarts each time
      exp_backoff_restart_delay: 200,
      // Each log line gets a timestamp
      time: true,
    },
  ],
};
