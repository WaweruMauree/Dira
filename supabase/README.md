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

## Quick start (Supabase SQL Editor)

**Option A — schema + seed separately (recommended):**
1. Paste and run `schema.sql`
2. Paste and run `migrations/003_seed_data.sql`

**Option B — one shot:**
1. Paste and run `full_setup.sql`

**After running:**
1. Enable **Email** auth under Authentication → Providers
2. Sign up a test student — verify `profiles` and `students` rows are created automatically
3. Point your TypeScript backend at the Supabase Postgres connection string (service role for writes)

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
