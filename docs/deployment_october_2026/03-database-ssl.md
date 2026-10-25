# 3. Encrypted database connection

Part of Phase A (code preparation) of the move to AWS.

## Why

On the laptop, the app and the Docker database are on the same machine, so
nothing travels over a network. On AWS the app runs on the EC2 server and the
database on RDS: two machines, so every query and result (contact messages,
admin sessions) crosses Amazon's network. Two risks:

1. **Someone reads the traffic.** Encryption (SSL/TLS) scrambles it.
2. **Something pretends to be the database.** RDS shows a certificate, like an
   ID card. The app checks it against Amazon's certificate file (the "CA"),
   and refuses to connect to anything that isn't really RDS.

## What changed

No change in how the app connects: the database library (`pg`) reads the SSL
settings straight from `DATABASE_URL`. The site, the pre-build check
(`src/server/db/check.ts`) and migrations all use that one address.

- `src/server/db/check.ts` (runs before every `pnpm build`) now prints the
  real reason it can't connect (SSL, certificate, address), not only
  "start it with pnpm db:up", which only makes sense on the laptop.
- `.env.example` shows the production address format.

### Checked on the laptop (2026-10-25)

Against the Docker database, which has no SSL:

| Address                               | Result                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| plain (as on the laptop)              | connects                                                   |
| `verify-full` + Amazon's certificate  | **refuses**: "The server does not support SSL connections" |
| `verify-full` + a missing certificate | **refuses**: file not found                                |

So with these settings the app never falls back to an unencrypted
connection. `pg` loads the certificate and keeps checking switched on, with
no security warnings.

`drizzle-kit migrate` also refused, but printed no reason. Item 5 replaced it
with a migrate script that does print it (see 05-migrations.md).

## The production address

```
postgres://peyyala_prod:<password>@<rds-endpoint>:5432/peyyala_prod?sslmode=verify-full&sslrootcert=/srv/shared/rds-ca.pem
```

| Part                                    | Meaning                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| `peyyala_prod:<password>`               | this site's own database login (not the RDS master user)       |
| `<rds-endpoint>`                        | the RDS address, e.g. `shared-db-1.xxxx.ap-south-1.rds.amazonaws.com` |
| `/peyyala_prod`                         | this site's own database                                       |
| `sslmode=verify-full`                   | encrypt, check the certificate, and check it's for this address |
| `sslrootcert=/srv/shared/rds-ca.pem`    | Amazon's certificate file on the server                        |

Use a password of only letters and digits (e.g. `openssl rand -hex 24`).
Symbols like `@ / : ?` would have to be escaped inside the address.

Locally nothing changes: `.env.local` keeps the plain Docker address.

## The certificate file

Amazon's **global** bundle, which covers every region, so it also works for
future projects' databases wherever they are:
`https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem`

One copy on the server, shared by every project: `/srv/shared/rds-ca.pem`.

## What you do

### Phase B (RDS)

Nothing extra: RDS for PostgreSQL 15 and newer only accepts encrypted
connections by default (`rds.force_ssl = 1`). Leave it on.

### Phase C (server setup, part of the setup script)

```bash
sudo mkdir -p /srv/shared
sudo curl -fsSL -o /srv/shared/rds-ca.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
sudo chmod 644 /srv/shared/rds-ca.pem
```

Check it reaches RDS, encrypted and verified (as the master user, while
creating the databases):

```bash
psql "host=<rds-endpoint> port=5432 dbname=postgres user=<master-user> sslmode=verify-full sslrootcert=/srv/shared/rds-ca.pem"
```

### Phase E (going live)

1. Put the production address (above) in `/srv/peyyala/prod/.env` as
   `DATABASE_URL`.
2. Confirm the site's own connection is encrypted:

   ```bash
   psql "$(grep ^DATABASE_URL= /srv/peyyala/prod/.env | cut -d= -f2-)" \
     -c "select ssl, version, cipher from pg_stat_ssl where pid = pg_backend_pid();"
   ```

   Expect `ssl = t` and a TLS version such as `TLSv1.3`.
3. The deploy's pre-build check prints `✓ Database ready (...)`.

## If it fails

The pre-build check prints the reason:

| Message contains                         | Cause                                                               |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `ENOENT ... rds-ca.pem`                  | certificate file missing: rerun the Phase C download               |
| `self-signed certificate in certificate chain` / `unable to get local issuer certificate` | wrong or outdated certificate file: download it again |
| `Hostname/IP does not match certificate` | the address isn't the RDS endpoint (e.g. an IP was used)            |
| `timeout` / `ECONNREFUSED`               | security group: port 5432 must allow `shared-web-sg`                |
| `password authentication failed`         | wrong login or password in the address                              |

Amazon renews its certificates rarely and announces it well ahead; the global
bundle includes the new ones. When that happens, rerun the download.

## Status

- [x] SSL settings checked against the local database (refuses without encryption)
- [x] Pre-build check shows the real reason it can't connect
- [x] `.env.example` shows the production address
- [x] Certificate file on the server (Phase C, [phase-c-03](phase-c-03-database-tools.md))
- [x] `psql` check against RDS with `verify-full` (Phase C): TLS verified, a
      wrong certificate is refused
- [ ] Production `DATABASE_URL` set, `ssl = t` confirmed (Phase E)
