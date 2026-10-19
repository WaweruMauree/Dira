# Dira — Supabase Database Schema

PostgreSQL schema for the Dira career guidance platform, mapped from the **168663 DIAGRAMS.docx** ER diagram to Supabase Auth.

## Files

| File | Contents | When to use |
|---|---|---|
| [`schema.sql`](schema.sql) | Full DDL + RLS | **Recommended** — run once in Supabase SQL Editor |
| [`full_setup.sql`](full_setup.sql) | Schema + RLS + seed data | Fresh project — one paste |
| [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql) | DDL only | Incremental migration workflow |
| [`migrations/002_rls_policies.sql`](migrations/002_rls_policies.sql) | RLS policies | After 001 if using split migrations |
| [`migrations/003_seed_data.sql`](migrations/003_seed_data.sql) | Starter data | After schema on empty DB |
| [`migrations/004_conversations.sql`](migrations/004_conversations.sql) | Conversations, user_jobs, CVs, salary estimates | After 001–003 on an existing project |
| [`migrations/005_profile_avatar.sql`](migrations/005_profile_avatar.sql) | Profile avatar columns + `avatars` Storage bucket | After 004 on an existing project |
| [`migrations/006_user_job_views.sql`](migrations/006_user_job_views.sql) | Persistent job listing view history (Apply clicks) | After 005 on an existing project |
| [`migrations/007_skills_gap_role_report.sql`](migrations/007_skills_gap_role_report.sql) | Skills gap reports per career interest (JSON report + methodology) | After 006 on an existing project |
| [`migrations/008_profiles_phone_unique.sql`](migrations/008_profiles_phone_unique.sql) | Unique index on `profiles.phone_number` (Kenyan E.164 at signup) | After 007; dedupe existing phones first |
| [`migrations/009_career_search_feedback.sql`](migrations/009_career_search_feedback.sql) | Optional job-search feedback from onboarding step 4 | After 008; internal/admin use, not on profile UI |
| [`migrations/010_career_pathways_update.sql`](migrations/010_career_pathways_update.sql) | UPDATE policy on `career_pathways` for student work-plan edits | After 009 on an existing project |

**Signup phone numbers:** Store as E.164 (`+2547XXXXXXXX`). The API checks duplicates before signup; migration 008 prevents race duplicates at the database.

## Quick start (Supabase SQL Editor)

**Option A — schema + seed separately (recommended):**
1. Paste and run `schema.sql`
2. Paste and run `migrations/003_seed_data.sql`

**Option B — one shot:**
1. Paste and run `full_setup.sql`

**After running:**
1. Enable **Email** auth under Authentication → Providers
2. Sign up a test student — verify `profiles` and `students` rows are created automatically
3. Point your TypeScript backend at the Supabase project URL and keys. **Onboarding via the Express API requires `SUPABASE_SERVICE_ROLE_KEY`** in `backend/.env` (Dashboard → Settings → API → service_role). The API verifies the user JWT, then writes with the service role so RLS gaps (e.g. missing `students` UPDATE policy) do not block Complete Setup.

**Profiles on signup:** New users need the `handle_new_user` trigger from `schema.sql` (creates `profiles` + `students`/`admins`). If an auth user exists without a profile row (partial signup, old session, or trigger never applied), the Express API can **bootstrap** a profile on the first authenticated request when `SUPABASE_SERVICE_ROLE_KEY` is set—this mirrors the trigger but is not a substitute for running the schema in production.

**Optional (direct client writes):** If the browser ever updates `students.course` under the user JWT, apply the policy from [`migrations/004_conversations.sql`](migrations/004_conversations.sql) (`students_update_own`).

**Profile photos:** Run [`migrations/005_profile_avatar.sql`](migrations/005_profile_avatar.sql) so `profiles.avatar_kind`, `avatar_url`, and `jazzicon_seed` exist and the public `avatars` bucket allows users to upload `{user_id}/avatar.webp`.

**Onboarding (Complete Setup) checklist** — if you see errors like *Could not find the 'jazzicon_seed' column* or failures saving step 4 feedback, run these on your existing project (in order, after prior migrations):

1. [`migrations/005_profile_avatar.sql`](migrations/005_profile_avatar.sql) — `profiles.jazzicon_seed` (required for avatar seed on Complete Setup)
2. [`migrations/009_career_search_feedback.sql`](migrations/009_career_search_feedback.sql) — `student_profiles.career_search_feedback` (optional “Your voice” step 4)

After DDL, reload the PostgREST schema if the Supabase dashboard prompts you. The API also skips a missing `jazzicon_seed` column gracefully, but avatars and migrations should still be applied in production.

## Auth mapping (ER Users → Supabase)

The ER `Users` table is **not** duplicated. Supabase Auth owns credentials.

| ER `Users` column | Location |
|---|---|
| `user_id` (PK) | `auth.users.id` (UUID) |
| `email` | `auth.users.email` |
| `password_hash` | Supabase Auth (omitted from public schema) |
| `phone_number` | `profiles.phone_number` |
| `username` | `profiles.username` |
| `role` | `profiles.role` |
| `status` | `profiles.status` |
| `created_at` | `profiles.created_at` |

On signup, trigger `handle_new_user()` creates:
- `profiles` row for every user
- `students` row when `role = STUDENT`
- `admins` row when `role = ADMIN`

Pass metadata at signup (via Supabase Auth):

```json
{
  "role": "STUDENT",
  "full_name": "Jane Doe",
  "admission_number": "168663",
  "phone_number": "+254700000000",
  "course": "BBIT"
}
```

## ER entities (14/14)

| ER entity | Table | PK column |
|---|---|---|
| Users | `auth.users` + `profiles` | `auth.users.id` |
| Admin | `admins` | `id` |
| Student | `students` | `id` |
| Student_Profile | `student_profiles` | `profile_id` |
| Skills | `skills` | `skill_id` |
| Student_Skills | `student_skills` | `id` |
| Career_Interests | `career_interests` | `id` |
| Opportunity_Sources | `opportunity_sources` | `source_id` |
| Opportunities | `opportunities` | `opportunity_id` |
| Match_Results | `match_results` | `match_id` |
| Skills_Gap_Analyses | `skills_gap_analyses` | `analysis_id` |
| Pathway_Roles | `pathway_roles` | `role_id` |
| Career_Pathways | `career_pathways` | `pathway_id` |
| Audit_Logs | `audit_logs` | `log_id` |

### Class / sequence diagram additions

| Addition | Table / column |
|---|---|
| Opportunity ↔ Skill M2M | `opportunity_skills` |
| PathwayRole ↔ Skill M2M | `pathway_role_skills` |
| `onboarded` | `student_profiles.onboarded` |
| `config` | `opportunity_sources.config` |
| Profile embeddings | `student_profiles.profile_embedding` |
| Opportunity embeddings | `opportunities.embedding` |
| Hybrid match scores | `match_results.content_score`, `collab_score` |

### Support tables (activity / sequence flows)

`profile_interactions`, `user_interactions`, `aggregation_runs`, `saved_opportunities`, `community_submissions`, `learning_resources`, `pathway_edges`

## Environment variables (TypeScript backend)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (pooler, port 5432) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Client-side auth (if using Supabase JS client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend writes — bypasses RLS |
| `SUPABASE_JWT_SECRET` | Validate JWT `sub` claim as user ID |

## Seed data counts (expected after 003)

| Entity | Count |
|---|---|
| Skills | 30 |
| Opportunity sources | 4 (formal × 2, institutional × 1, informal × 1) |
| Pathway roles | 24 |
| Pathway edges | 5 |
| Learning resources | 3 |

## Validation checklist

- [ ] All 14 ER entities present
- [ ] No `password_hash` or custom `users` table in `public`
- [ ] Signup trigger creates `profiles` + role-specific row
- [ ] FK chain: `auth.users → profiles → students → student_profiles → match_results`
- [ ] `schema.sql` = `001_initial_schema.sql` + `002_rls_policies.sql`
- [ ] `full_setup.sql` = `schema.sql` + `003_seed_data.sql`

## Notes

- Embeddings use `vector(384)` via pgvector (MiniLM). Requires `CREATE EXTENSION vector` (enabled in schema).
- RLS is enabled on all public tables. The TypeScript backend should use the **service role** key for server-side writes.
- `student_skills.proficiency_type` maps ER `proficiency ENUM('SELF_ASSESSED')`; level stored separately as `proficiency_level` (1–5) for onboarding.
- **Skills Analysis (migration 007):** Run [`migrations/007_skills_gap_role_report.sql`](migrations/007_skills_gap_role_report.sql) so analyses persist and `GET /skills-gap/analyses` / `latest` work. Without 007, the API still returns a fresh report from `POST /skills-gap/analyze`, but rows are not stored.
