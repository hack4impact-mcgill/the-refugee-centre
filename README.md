# The Refugee Centre

## Tech Stack

| Layer              | Choice                             | Why                                                                                                 |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend + Backend | Next.js (App Router) + TypeScript  | One codebase for the staff dashboard and the API, easiest for a small rotating team to onboard onto |
| Database           | PostgreSQL via Supabase            | Free tier covers this scale (50 volunteers, one center) with room to grow                           |
| ORM                | Prisma                             | Typed schema doubles as living documentation of volunteers, positions, and shifts                   |
| Auth               | Supabase Auth                      | Staff-only login with role scoping per position, no custom auth to maintain                         |
| Notifications      | Email                              |                                                                                                     |
| Calendar           | Google Calendar integration        |                                                                                                     |
| Scheduling jobs    | Vercel Cron                        | Drives the weekly shift generation and the accept/reject waterfall                                  |
| Hosting            | Vercel (app) + Supabase (database) | Free at this scale, matters since TRC has no budget to take over hosting after handoff              |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 24
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), for the local Postgres database

The app runs on [Next.js](https://nextjs.org) 16.3.5, which `npm install` sets up, so it doesn't need to be installed separately.

### Running locally

Install dependencies:

```bash
npm install
```

Set up the local database (first time only, see [Database](#database) below):

1. Start Docker Desktop.
2. Start Postgres and create the tables (the connection strings are already in `.env.development`):

   ```bash
   npm run db:up
   npx prisma db push
   ```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Database

The app reads and writes Postgres through [Prisma](https://www.prisma.io). `prisma/schema.prisma` is the source of truth for the tables, and `npm install` generates the typed client into `src/generated/prisma`. Server code imports it from `@/lib/prisma`.

There are two databases:

| Database                 | Used by                        | Who changes its schema                         |
| ------------------------ | ------------------------------ | ---------------------------------------------- |
| Local Postgres in Docker | Each developer's `npm run dev` | You (no restrictions)                          |
| Supabase (hosted)        | The Vercel deployments         | CI, when a schema change is merged into `main` |

Never point your `.env.local` at Supabase for day-to-day work. Experiment on your local database, and the schema reaches Supabase automatically after the PR is merged.

#### Local database

`docker-compose.yml` runs Postgres 17 on `localhost:5432`, with user `postgres`, password `postgres` and database `trc`. The data is kept in a Docker volume so it survives restarts

The connection strings for it are committed in `.env.development`, so there's nothing to set up. Both `npm run dev` and the Prisma CLI load that file; production builds don't:

```bash
# Used by the app at runtime (on Vercel this is Supabase's transaction pooler)
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/trc"
# Used by the Prisma CLI: db push, migrate, studio (on Vercel this is Supabase's session pooler)
POSTGRES_URL_NON_POOLING="postgresql://postgres:postgres@localhost:5432/trc"
```

To use different values on your machine only, set the same variable in `.env.local` which takes priority over `.env.development`

```bash
npm run db:up               # Start Postgres in the background (waits until it's ready)
npm run db:down             # Stop it; the data is kept
docker compose down -v      # Stop it and delete all local data (then run `npx prisma db push` again)
docker compose logs db      # See Postgres logs if something won't connect
```

If `npm run db:up` fails because port 5432 is already in use, you already have Postgres installed on your machine. Either stop that service, or change the left side of `"5432:5432"` in `docker-compose.yml` (for example to `"5433:5432"`) and set both URLs with that port in your `.env.local`

#### Changing the schema

> Until the project goes to production with real users, sync schema changes with `db push` instead of migrations. The schema is still changing often, and there's no data worth keeping:
>
> ```bash
> npx prisma db push
> npx prisma generate
> ```
>
> With the default URLs in `.env.development`, this only changes your local database. Commit the `schema.prisma` change in your PR.
>
> This is temporary. Before launch, switch to the migration workflow below by creating a single migration from the schema at that point, then use migrations for every change after it.

After launch only. Once the project is in production with real users and the first migration has been created, stop using `db push`. To change the schema from then on, edit `prisma/schema.prisma`, then create and apply a migration to your local database and regenerate the client:

```bash
npx prisma migrate dev --name <what-changed>
npx prisma generate
```

The first command writes the SQL into a new folder under `prisma/migrations` and applies it to your local database. Commit that folder along with the schema. Don't change tables from the Supabase dashboard directly since Prisma will see the database as drifted from the migrations.

> When switching to migrations, the CI workflow and the manual push have to switch too. In `.github/workflows/db-push.yml`, add `prisma/migrations/**` to `paths` and change the push step to `npx prisma migrate deploy --config prisma.supabase.config.ts`. Change the `db:push:supabase` script in `package.json` the same way. `migrate deploy` only applies committed migrations and never prompts, so the data-loss checks move into PR review of the migration SQL.

#### How the schema reaches Supabase

When a commit that changes `prisma/schema.prisma` lands on `main`, the **Push schema to Supabase** workflow (`.github/workflows/db-push.yml`) runs `npm run db:push:supabase` against the production database. You don't need to do anything after your PR is merged.

That workflow runs at the same time as Vercel's production deploy, so for a minute or two the new code can be live before the new tables or columns exist. Additive changes (new tables, new optional columns) are safe to merge any time. For anything else, tell the project lead before merging.

**If the workflow fails** because the change would delete data (dropping a column or table that still has rows, or adding a required column to a table that has rows), Prisma stops without changing anything. That's on purpose, so CI never deletes production data on its own. The project lead reviews it and pushes by hand (below).

#### Pushing the schema to Supabase by hand (when CI refuses a data-loss change)

From an up-to-date `main`:

```bash
npm run db:push:supabase
```

This runs `prisma db push` with `prisma.supabase.config.ts`, which connects to `SUPABASE_DB_URL` instead of the local database. Only the project lead has that URL in their `.env.local` (it holds the Supabase database password), so for everyone else the command stops with `SUPABASE_DB_URL is not set`:

```bash
# Supabase session pooler (port 5432). Supabase dashboard → Connect → Session pooler
SUPABASE_DB_URL="postgresql://postgres.kcedxfowxtmrcrrffzzh:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

When run by hand, Prisma shows each change that would delete data and asks before applying it. Read that warning before saying yes, because the Supabase database is the one the deployed app uses.

The workflow reads the same URL from the `SUPABASE_DB_URL` secret in the repository's `production` environment

Useful commands:

```bash
npx prisma generate                                         # Rebuild the typed client after any schema change (npm install also does this)
npx prisma format                                           # Format schema.prisma and fill in missing relation fields (Prettier doesn't touch .prisma files)
npx prisma studio                                           # Browse and edit data in the browser, edits are saved to the POSTGRES_URL_NON_POOLING database
npx prisma migrate status                                   # List which migrations the database has applied
npx prisma migrate dev --name <what-changed>                # Write a migration from schema.prisma and apply it
npx prisma migrate dev --name <what-changed> --create-only  # Write the migration without applying it, so the SQL can be edited first
npx prisma migrate deploy                                   # Apply committed migrations the database hasn't run yet, without writing new ones
npx prisma migrate reset                                    # Drop all tables and replay every migration (WARNING: deletes all data)
npx prisma db push                                          # Sync the database to schema.prisma without a migration (WARNING: can drop columns and leaves no history)
```

### Linting and formatting

The project uses [ESLint](https://eslint.org) for linting and [Prettier](https://prettier.io) for formatting.

```bash
npm run lint          # Check for lint errors
npm run lint:fix      # Fix lint errors where possible
npm run format        # Format all files
npm run format:check  # Check formatting without changing files
```

CI runs `npm run lint`, `npm run format:check` and `npm run build` (which also type-checks) on every pull request and push to `main`. All three must pass, so run them before pushing.

#### Email sign-in

The app uses Supabase Auth to send passwordless magic links. Entering an email on
the sign-in page sends a link to an existing account. The registration page can
create a Supabase Auth account for a new email. Clicking the link verifies the
user and signs them in.

Authentication uses the configured Supabase project even when the app is using
a local Postgres database. Ask the project maintainer for the Supabase project
URL and publishable key; do not commit credentials to the repository. Add them
to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
