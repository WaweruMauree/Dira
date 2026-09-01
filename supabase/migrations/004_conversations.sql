-- =============================================================================
-- Dira — Conversations, user-scoped jobs, CVs, salary estimates, RLS gaps
-- Run after 001–003 (or after full_setup.sql on an existing project)
-- =============================================================================

-- === ENUMS ===
DO $$ BEGIN
  CREATE TYPE public.agent_mode AS ENUM ('general', 'career_guidance', 'job_aggregation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'tool', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === CONVERSATIONS ===
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode        public.agent_mode NOT NULL DEFAULT 'general',
  title       VARCHAR(255) NOT NULL DEFAULT 'New conversation',
  preview     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role              public.message_role NOT NULL,
  content           TEXT NOT NULL DEFAULT '',
  tool_calls        JSONB,
  tool_call_id      VARCHAR(100),
  name              VARCHAR(150),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
  ON public.conversation_messages(conversation_id, created_at);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- === USER-SCOPED FETCHED JOBS ===
-- Field mapping from public job APIs (client fetches, then POSTs here):
--   external_id     ← Jobicy id | Himalayas guid | Remotive id | Arbeitnow slug
--   source          ← jobicy | himalayas | remotive | arbeitnow | remoteok
--   title           ← jobTitle | title
--   organisation    ← companyName | company_name
--   description     ← jobDescription | description | excerpt (HTML stripped client-side)
--   location        ← jobGeo | locationRestrictions | candidate_required_location | location
--   url             ← url | applicationLink
--   employment_type ← jobType | employmentType | job_type | job_types
--   experience_level← jobLevel / seniority mapped to 1–5
--   salary_*        ← salaryMin/Max/Currency/Period or Remotive salary text
--   published_at    ← pubDate | publication_date | created_at
--   tags            ← jobIndustry | categories | tags
--   raw             ← original API object
CREATE TABLE IF NOT EXISTS public.user_jobs (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_id        TEXT NOT NULL,
  source             TEXT NOT NULL,
  title              VARCHAR(255) NOT NULL,
  organisation       VARCHAR(200),
  description        TEXT,
  location           VARCHAR(150),
  url                TEXT,
  employment_type    TEXT,
  experience_level   INT CHECK (experience_level IS NULL OR experience_level BETWEEN 1 AND 5),
  salary_min         NUMERIC,
  salary_max         NUMERIC,
  salary_currency    VARCHAR(10),
  salary_period      TEXT,
  salary_text        TEXT,
  published_at       TIMESTAMPTZ,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  saved              BOOLEAN NOT NULL DEFAULT false,
  raw                JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_user_jobs_user_id ON public.user_jobs(user_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_jobs_saved ON public.user_jobs(user_id, saved) WHERE saved = true;

-- === STUDENT CVs (JSON Resume) ===
CREATE TABLE IF NOT EXISTS public.student_cvs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL DEFAULT 'Resume',
  target_job_id   BIGINT REFERENCES public.user_jobs(id) ON DELETE SET NULL,
  resume          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_cvs_user_id ON public.student_cvs(user_id);

DROP TRIGGER IF EXISTS trg_student_cvs_updated_at ON public.student_cvs;
CREATE TRIGGER trg_student_cvs_updated_at
  BEFORE UPDATE ON public.student_cvs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- === SALARY ESTIMATES ===
CREATE TABLE IF NOT EXISTS public.salary_estimates (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query         VARCHAR(255) NOT NULL,
  location      VARCHAR(150),
  currency      VARCHAR(10),
  min           NUMERIC,
  median        NUMERIC,
  max           NUMERIC,
  sample_size   INT NOT NULL DEFAULT 0,
  source        TEXT,
  histogram     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_estimates_user_id ON public.salary_estimates(user_id, created_at DESC);

-- === RLS ===
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_estimates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_all ON public.conversations;
CREATE POLICY conversations_all ON public.conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS conversation_messages_all ON public.conversation_messages;
CREATE POLICY conversation_messages_all ON public.conversation_messages
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS user_jobs_all ON public.user_jobs;
CREATE POLICY user_jobs_all ON public.user_jobs
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS student_cvs_all ON public.student_cvs;
CREATE POLICY student_cvs_all ON public.student_cvs
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS salary_estimates_all ON public.salary_estimates;
CREATE POLICY salary_estimates_all ON public.salary_estimates
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- match_results previously had SELECT + student UPDATE only; admins could not insert
DROP POLICY IF EXISTS match_results_admin_all ON public.match_results;
CREATE POLICY match_results_admin_all ON public.match_results
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- students previously had SELECT only; onboarding needs to persist course
DROP POLICY IF EXISTS students_update_own ON public.students;
CREATE POLICY students_update_own ON public.students
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
