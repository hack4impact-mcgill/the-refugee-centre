# The Refugee Centre

## Tech Stack

| Layer              | Choice                                                                  | Why                                                                                                 |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend + Backend | Next.js (App Router) + TypeScript                                       | One codebase for the staff dashboard and the API, easiest for a small rotating team to onboard onto |
| Database           | PostgreSQL via Supabase                                                 | Free tier covers this scale (50 volunteers, one center) with room to grow                           |
| ORM                | Prisma                                                                  | Typed schema doubles as living documentation of volunteers, positions, and shifts                   |
| Auth               | Clerk or Supabase Auth                                                  | Staff-only login with role scoping per position, no custom auth to maintain                         |
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

### Linting and formatting

The project uses [ESLint](https://eslint.org) for linting and [Prettier](https://prettier.io) for formatting.

```bash
npm run lint          # Check for lint errors
npm run lint:fix      # Fix lint errors where possible
npm run format        # Format all files
npm run format:check  # Check formatting without changing files
```

CI runs `npm run lint`, `npm run format:check` and `npm run build` (which also type-checks) on every pull request and push to `main`. All three must pass, so run them before pushing.
