# peyyala.com

The portfolio of **Joshva Peyyala**, a backend-focused full-stack developer.
It covers his projects with case studies, the services he offers and his
resume, plus a contact form. Everything on it is edited from a private admin,
so no code changes are needed to update content.

**Live site:** [peyyala.com](https://peyyala.com) (launching soon)

## What it does

**The public site**

- **Home, Work, Services, Resume, Contact.** Each project has its own case-study page.
- **Fast pages.** Pages are prerendered from the database and served from
  Next.js's cache. When the admin saves, only the affected pages are refreshed
  (tag-based revalidation), so edits show up immediately without a rebuild.
- **Link previews.** A generated preview image for the site and for each
  project, drawn in the current design, for sharing on LinkedIn and WhatsApp.
- **Printable resume.** The resume page prints cleanly, and the latest resume
  PDF can be downloaded.
- **A spam-resistant contact form.** Server-side validation and per-visitor
  and site-wide rate limits. Visitor addresses are stored only as keyed
  hashes. Messages are saved first and emailed second, so none are lost if
  email fails.

**The admin** (`/admin`)

- **Google sign-in** for a single allowed account.
- **Projects, profile and services.** Edit everything the site shows,
  including experience, skills and case studies, with unsaved-changes guards.
- **Uploads.** Project screenshots and the resume PDF. File types are checked
  from the file's bytes, not its name.
- **Appearance.** Switch the whole site between 2 designs (Ink, Wave) and 11
  colour palettes, with live previews.
- **Inbox** for contact messages.
- **Dashboard** with a site checklist (missing screenshots, case studies, resume).

## Built with

| Area      | Choice                                                                         |
| --------- | ------------------------------------------------------------------------------ |
| Framework | Next.js 16 (App Router, Cache Components, Server Actions), React 19, TypeScript |
| Styling   | Tailwind CSS 4, with designs and palettes as data (`src/content/themes.ts`)     |
| Database  | PostgreSQL 17 with Drizzle ORM and SQL migrations                              |
| Auth      | Better Auth with Google OAuth                                                  |
| Validation | Zod, shared by forms and server actions                                       |
| Files     | Amazon S3, one bucket per environment                                          |
| Email     | Brevo (HTTP API)                                                               |
| Hosting   | AWS Mumbai: EC2 (Caddy for HTTPS, PM2), RDS PostgreSQL over verified TLS        |
| Deploys   | Releases built on the server, health-checked, with automatic rollback          |

How it's deployed: [docs/deployment_october_2026](docs/deployment_october_2026/README.md).

## Running it locally

You need **Node 22**, **pnpm** (`corepack enable` sets it up) and **Docker**.

```bash
pnpm install
cp .env.example .env.local   # then fill it in, see below
pnpm db:up                   # Postgres 17 in Docker
pnpm db:migrate              # create the tables
pnpm db:seed                 # load the starting content
pnpm dev                     # http://localhost:3000, admin at /admin
```

In `.env.local` (each setting is explained in `.env.example`):

- `BETTER_AUTH_SECRET`: any long random string. The command to generate one
  is in `.env.example`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `ADMIN_EMAIL`, for the admin
  sign-in. The OAuth client needs `http://localhost:3000` as an authorised
  origin, and `http://localhost:3000/api/auth/callback/google` as a redirect URI.
- `S3_*` and `STORAGE_PUBLIC_URL`, for uploads. The site runs without them,
  but uploading in the admin needs a bucket. Setup steps:
  [02-s3-storage.md](docs/deployment_october_2026/02-s3-storage.md).
- Email is printed in the terminal locally (`MAIL_DRIVER=console`), so it
  needs no setup.

## Commands

| Command                    | What it does                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                 | development server                                                 |
| `pnpm build`               | checks the database is reachable and seeded, then builds           |
| `pnpm start`               | runs a production build                                            |
| `pnpm lint`                | ESLint                                                             |
| `pnpm db:up`               | starts the local Postgres (Docker)                                 |
| `pnpm db:generate`         | writes a migration from changes to `src/server/db/schema.ts`       |
| `pnpm db:migrate`          | applies pending migrations, all or nothing                         |
| `pnpm db:migrate --pending` | prints how many migrations are pending                            |
| `pnpm db:seed`             | loads the starting content into an empty database (`--reset` replaces it, `--check` compares) |
| `pnpm db:studio`           | Drizzle Studio, to browse the database                             |

Migrations must keep the previous release working, because they run before
the new code goes live. Add first, remove in a later deploy:
[05-migrations.md](docs/deployment_october_2026/05-migrations.md).

## Where things are

```
src/
  app/(site)/        public pages
  app/admin/         admin pages and their server actions
  app/api/           auth and the /api/health check
  components/        site and admin components
  content/           designs, palettes and content types
  lib/               content queries (cached), schemas, link-preview helpers
  server/            database, auth, storage (S3), mail, upload checks
  server/db/         schema, migrations, migrate and seed scripts
scripts/deploy.sh    deploy and rollback, run on the server
ecosystem.config.cjs PM2 config for the server
docs/                deployment notes
```
