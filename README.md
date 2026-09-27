# The Refugee Centre

## Tech Stack

| Layer              | Choice                                                                  | Why                                                                                                 |
| ------------------ |-------------------------------------------------------------------------| --------------------------------------------------------------------------------------------------- |
| Frontend + Backend | Next.js (App Router) + TypeScript                                       | One codebase for the staff dashboard and the API, easiest for a small rotating team to onboard onto |
| Database           | PostgreSQL via Supabase                                                 | Free tier covers this scale (50 volunteers, one center) with room to grow                           |
| ORM                | Prisma                                                                  | Typed schema doubles as living documentation of volunteers, positions, and shifts                   |
| Auth               | Supabase Auth                                                           | Staff-only login with role scoping per position, no custom auth to maintain                         |
| Notifications      | Email                                                                   |                                                                                                     |
| Calendar           | Undecided (generated `.ics` attachment vs. Google Calendar integration) |                                                                                                     |
| Scheduling jobs    | Vercel Cron                                                             | Drives the weekly shift generation and the accept/reject waterfall                                  |
| Hosting            | Vercel (app) + Supabase (database)                                      | Free at this scale, matters since TRC has no budget to take over hosting after handoff              |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 24

The app runs on [Next.js](https://nextjs.org) 16.3.5, which `npm install` sets up, so it doesn't need to be installed separately.

### Running locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Database

The app reads and writes the Supabase database through [Prisma](https://www.prisma.io). `prisma/schema.prisma` is the source of truth for the tables, and `npm install` generates the typed client into `src/generated/prisma`. Server code imports it from `@/lib/prisma`.

Both the app and the Prisma CLI read their connection strings from `.env.local`:

```bash
# Transaction pooler (port 6543), used by the app at runtime
POSTGRES_PRISMA_URL="postgresql://postgres.kcedxfowxtmrcrrffzzh:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
# Session pooler (port 5432), used by the Prisma CLI for migrations
POSTGRES_URL_NON_POOLING="postgresql://postgres.kcedxfowxtmrcrrffzzh:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

> Until the project goes to production with real users, sync schema changes with `db push` instead of migrations. The schema is still changing often, and there's no data worth keeping:
>
> ```bash
> npx prisma db push
> npx prisma generate
> ```
>
> This is temporary. Before launch, switch to the migration workflow below by creating a single migration from the schema at that point, then use migrations for every change after it.

After launch only. Once the project is in production with real users and the first migration has been created, stop using `db push`. To change the schema from then on, edit `prisma/schema.prisma`, then create and apply a migration and regenerate the client:

```bash
npx prisma migrate dev --name <what-changed>
npx prisma generate
```

The first command writes the SQL into a new folder under `prisma/migrations` and applies it to the database. Commit that folder along with the schema. Don't change tables from the Supabase dashboard directly since Prisma will see the database as drifted from the migrations

Useful commands:

```bash
npx prisma generate                             # Rebuild the typed client after any schema change (npm install also does this)
npx prisma format                               # Format schema.prisma and fill in missing relation fields (Prettier doesn't touch .prisma files)
npx prisma studio                               # Browse and edit data in the browser; edits are saved to the real database
npx prisma migrate status                       # List which migrations the database has applied
npx prisma migrate dev --name <what-changed>    # Write a migration from schema.prisma and apply it
npx prisma migrate deploy                       # Apply committed migrations the database hasn't run yet, without writing new ones
npx prisma migrate reset                        # Drop all tables and replay every migration (WARNING: deletes all data)
npx prisma db push                              # Sync the database to schema.prisma without a migration (WARNING: can drop columns and leaves no history)
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
