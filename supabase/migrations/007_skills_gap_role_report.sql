-- Role-based skills gap reports (per career interest)

ALTER TABLE public.skills_gap_analyses
  ALTER COLUMN opportunity_id DROP NOT NULL;

ALTER TABLE public.skills_gap_analyses
  ADD COLUMN IF NOT EXISTS target_role TEXT,
  ADD COLUMN IF NOT EXISTS pathway_role_id BIGINT REFERENCES public.pathway_roles(role_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS methodology JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_skills_gap_profile_created
  ON public.skills_gap_analyses(profile_id, created_at DESC);
