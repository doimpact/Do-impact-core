# DO.Impact Core (open-source edition)

The operating system for small manufacturers — Strategy, Commercial,
Operations (OMS), People, and Execution — as a self-hosted, single-user web
app. This is the open-source core of the hosted [DO.Impact](https://www.doimpact.app)
product, released under the **AGPL-3.0** license (see `LICENSE`).

The open-source edition intentionally excludes: user accounts & login,
billing/subscriptions, platform admin, marketing pages, AI features, and all
usage/funnel tracking. It ships pre-loaded with the fictional **TitanScale
Template** sample company so every module is populated from the first launch.

## What you need

- [Bun](https://bun.sh) (or Node.js 20+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (requires Docker) — or
  any Postgres + PostgREST compatible Supabase project, including a free
  project on supabase.com.

## Quick start

```bash
# 1. Start a local Supabase stack (Postgres, PostgREST, Storage, ...)
supabase init        # only if there is no supabase/config.toml yet
supabase start       # prints API URL + anon key

# 2. Apply the schema + sample data
supabase db reset    # runs every file in supabase/migrations in order

# 3. Configure the app
cp .env.example .env # paste the anon key printed by `supabase status`

# 4. Install and run
bun install
bun run dev          # http://localhost:8080
```

The app opens straight into the workspace — there is no login screen. The
TitanScale Template sample company is selected by default; create your own
workspace from the company switcher in the top bar.

## Included modules

| Pillar | Highlights |
| --- | --- |
| Strategy | Hoshin Kanri, value-driver tree, A3, restructuring, turnaround finance, waterfalls |
| Commercial | Accounts, stakeholders, opportunities, contracts review, plan vs pipeline |
| Operations (OMS) | Daily SQDP, KPIs (250+ industrial library), SIOP, NPI/industrialization, end-of-life, risk calendar, shop-floor kiosk (`/floor`) |
| People | Employees, skills & matrix, gaps, certifications, development, leadership, org chart |
| Execution | Actions/Gantt, board & weekly reports, Problem Solver (8D, TOC, …) |
| Compliance | Safety, business continuity, AM/PM |

## How local mode works

- A fixed local identity (`src/lib/local-user.ts`) replaces authentication.
  `supabase.auth.*` is shimmed in `src/integrations/supabase/client.ts`.
- The final migration (`supabase/migrations/99999999999900_oss_local_mode.sql`)
  disables RLS on every table, grants full access to the local API roles, and
  turns hosted-only RPCs (billing paywall, demo showcase, invites) into
  no-ops.
- The active workspace is remembered in `localStorage`.

## Data safety

Your data lives in your own Supabase/Postgres instance. The app never calls
home: no analytics, no ads, no error reporting.

## License

GNU Affero General Public License v3.0. If you modify this software and offer
it as a network service, you must offer your modified source to its users.
Commercial licensing for closed-source use is available — see
https://www.doimpact.app.
