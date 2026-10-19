-- Job listing view history (Apply / external link clicks)

CREATE TABLE IF NOT EXISTS public.user_job_views (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_job_id  BIGINT REFERENCES public.user_jobs(id) ON DELETE SET NULL,
  title        VARCHAR(255) NOT NULL,
  organisation VARCHAR(200),
  url          TEXT NOT NULL,
  source       TEXT,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_job_views_user ON public.user_job_views(user_id, viewed_at DESC);

ALTER TABLE public.user_job_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_job_views_select_own ON public.user_job_views;
CREATE POLICY user_job_views_select_own ON public.user_job_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS user_job_views_insert_own ON public.user_job_views;
CREATE POLICY user_job_views_insert_own ON public.user_job_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
