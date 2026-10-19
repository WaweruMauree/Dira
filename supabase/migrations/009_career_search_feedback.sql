-- Optional onboarding feedback (not shown on student profile UI).
-- Run after 008 on existing projects.

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS career_search_feedback TEXT;
