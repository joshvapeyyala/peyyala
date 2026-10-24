# Phase B, step 3: Security groups (firewalls)

## Why

A security group is a firewall AWS puts in front of a server or database:
it lists what may come in, and blocks everything else. Two of them:

| Group           | Attached to (later)         | Lets in                                                          |
| --------------- | --------------------------- | ---------------------------------------------------------------- |
| `shared-web-sg` | the EC2 server (step 4)     | web traffic (80, 443) and SSH (22) from anywhere                 |
| `shared-db-sg`  | the RDS database (step 6)   | Postgres (5432) **only from servers in `shared-web-sg`**         |

The database therefore can't be reached from the internet at all, not even
with the right password: only your server can talk to it.

SSH (22) is open to everyone, by plan, and safe because:

- login is key-only (no passwords to guess)
- fail2ban (Phase C) blocks addresses that keep trying
- GitHub Actions (Phase F) deploys over SSH from addresses that change, so
  limiting 22 to your own IP would block it (and your home IP changes too)

Time: about 5 minutes. Cost: free.

## Steps (as `joshva-admin`, region Mumbai)

### 0. Check there's a default VPC

**VPC** > **Your VPCs**: one row should say **Default VPC: Yes**. Both
groups go in it, and so do the server and the database. (If there isn't one:
stop and say so.)

### A. `shared-web-sg`

**EC2** > **Network & Security** > **Security Groups** > **Create security group**:

1. Name: `shared-web-sg`
2. Description: `Web server: HTTP, HTTPS, SSH`
3. VPC: the default VPC
4. **Inbound rules** > Add rule, four times:

   | Type        | Protocol | Port | Source             | Description              |
   | ----------- | -------- | ---- | ------------------ | ------------------------ |
   | HTTP        | TCP      | 80   | Anywhere-IPv4 (`0.0.0.0/0`) | HTTP, redirected to HTTPS |
   | HTTPS       | TCP      | 443  | Anywhere-IPv4 (`0.0.0.0/0`) | HTTPS                    |
   | Custom UDP  | UDP      | 443  | Anywhere-IPv4 (`0.0.0.0/0`) | HTTP/3 (Caddy)           |
   | SSH         | TCP      | 22   | Anywhere-IPv4 (`0.0.0.0/0`) | SSH, key-only            |

5. **Outbound rules**: leave the default (all traffic). The server needs it
   for updates, GitHub, S3 and Brevo.
6. Tag `Stack` = `shared` > **Create security group**.

### B. `shared-db-sg`

Create security group again:

1. Name: `shared-db-sg`
2. Description: `Database: Postgres from shared-web-sg only`
3. VPC: the default VPC
4. **Inbound rules** > Add rule, once:

   | Type       | Protocol | Port | Source                                   | Description          |
   | ---------- | -------- | ---- | ---------------------------------------- | -------------------- |
   | PostgreSQL | TCP      | 5432 | Custom: start typing `shared-web-sg` and pick it (`sg-...`) | From the web server |

5. **Outbound rules**: leave the default.
6. Tag `Stack` = `shared` > **Create security group**.

The source must be the **security group**, not an IP address: then any
server in `shared-web-sg` can reach the database, even if its address changes.

## How to check

**Security Groups** list:

- `shared-web-sg`: 4 inbound rules (80, 443 TCP, 443 UDP, 22)
- `shared-db-sg`: 1 inbound rule, 5432, source `sg-...` (`shared-web-sg`)

The real test comes after steps 4–6: the server reaches the database, your
laptop doesn't.

## Status

- [x] `shared-web-sg` created (80, 443/TCP, 443/UDP, 22)
- [x] `shared-db-sg` created (5432 from `shared-web-sg` only)
