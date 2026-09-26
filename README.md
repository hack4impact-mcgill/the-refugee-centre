# The Refugee Centre

## Tech Stack

| Layer              | Choice                                                                  | Why                                                                                                 |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend + Backend | Next.js (App Router) + TypeScript                                       | One codebase for the staff dashboard and the API, easiest for a small rotating team to onboard onto |
| Database           | PostgreSQL via Supabase                                                 | Free tier covers this scale (50 volunteers, one center) with room to grow                           |
| ORM                | Prisma                                                                  | Typed schema doubles as living documentation of volunteers, positions, and shifts                   |
| Auth               | Supabase Auth                                                           | Staff-only login with role scoping per position, no custom auth to maintain                         |
| Notifications      | Email                                                                   |                                                                                                     |
| Calendar           | Undecided (generated `.ics` attachment vs. Google Calendar integration) |                                                                                                     |
| Scheduling jobs    | Vercel Cron, or Inngest/Trigger.dev for retry logic                     | Drives the weekly shift generation and the accept/reject waterfall                                  |
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
POSTGRES_PRISMA_URL="postgres://postgres.<project-ref>:<password>@aws-<region>.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
# Session pooler (port 5432), used by the Prisma CLI for migrations
POSTGRES_URL_NON_POOLING="postgres://postgres.<project-ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Copy both from the Supabase dashboard's **Connect** button. On Vercel, the Supabase integration sets them automatically.

To change the schema, edit `prisma/schema.prisma`, then create and apply a migration:

```bash
npx prisma migrate dev --name <what-changed>
```

Commit the new folder under `prisma/migrations`. Don't change tables from the Supabase dashboard, or Prisma will see the database as drifted from its migrations.

### Linting and formatting

The project uses [ESLint](https://eslint.org) for linting and [Prettier](https://prettier.io) for formatting.

```bash
npm run lint          # Check for lint errors
npm run lint:fix      # Fix lint errors where possible
npm run format        # Format all files
npm run format:check  # Check formatting without changing files
```

CI runs `npm run lint`, `npm run format:check` and `npm run build` (which also type-checks) on every pull request and push to `main`. All three must pass, so run them before pushing.
