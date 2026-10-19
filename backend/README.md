# Dira API

TypeScript Express API for the Dira career platform. Uses the live Supabase project (JWT + RLS). The agent selects tools; the frontend executes them.

## Setup

```bash
cd backend
cp .env.example .env
# fill SUPABASE_URL, SUPABASE_ANON_KEY, OPENROUTER_API_KEY (in backend/.env only — restart npm run dev after changes)
npm install
npm run dev
```

Health: `GET http://localhost:4000/api/v1/health` — check `features.openRouter` is `true` for custom career interests (e.g. roles not in the pathway catalog).

**OpenRouter:** Set `OPENROUTER_API_KEY` in `backend/.env`. The dev server does not reload `.env` on save; stop and run `npm run dev` again after editing secrets.

All other routes require `Authorization: Bearer <supabase_access_token>`.

**Onboarding & Supabase migrations:** Complete Setup updates `profiles.jazzicon_seed` (migration **005**) and may save `student_profiles.career_search_feedback` from step 4 (migration **009**). If those columns are missing, the API logs a warning and continues where possible (avatar seed and feedback are skipped). Apply [`supabase/migrations/005_profile_avatar.sql`](../supabase/migrations/005_profile_avatar.sql) and [`009_career_search_feedback.sql`](../supabase/migrations/009_career_search_feedback.sql) on your project.

**Programme skill suggestions:** `POST /api/v1/onboarding/programme-suggestions` with `{ courseCatalogId, programmeLabel }` returns AI-tailored technical/soft skills and career interests (Exa + OpenRouter), with static fallback when keys are missing.

## Scripts

- `npm run dev` — watch mode
- `npm run typecheck` — `tsc --noEmit`
- `npm run smoke` — sign in against live Supabase and hit every endpoint
- `npm run create-admin` — create the single admin user (requires `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`)

## Admin account

1. Add to `backend/.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `ADMIN_FULL_NAME`, `ADMIN_PHONE`.
2. Run `npm run create-admin` once (skips if an admin already exists).
3. Log in at the app `/login` with those credentials — you are redirected to `/admin`.
