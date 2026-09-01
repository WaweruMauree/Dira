# Dira API

TypeScript Express API for the Dira career platform. Uses the live Supabase project (JWT + RLS). The agent selects tools; the frontend executes them.

## Setup

```bash
cd backend
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_ANON_KEY, OPENROUTER_API_KEY
npm install
npm run dev
```

Health: `GET http://localhost:4000/api/v1/health`

All other routes require `Authorization: Bearer <supabase_access_token>`.

## Scripts

- `npm run dev` — watch mode
- `npm run typecheck` — `tsc --noEmit`
- `npm run smoke` — sign in against live Supabase and hit every endpoint
