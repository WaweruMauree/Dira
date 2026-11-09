-- =============================================================================
-- Dira — Full Supabase Schema (DDL + RLS)
-- Generated from migrations/001_initial_schema.sql + 002_rls_policies.sql
-- Run in Supabase SQL Editor to create the complete database structure
-- =============================================================================

-- =============================================================================
-- Dira — Supabase Initial Schema
-- Maps 168663 DIAGRAMS.docx ER (14 entities) to Supabase Auth + public schema
-- Run in Supabase SQL Editor (DDL only — no RLS; see 002_rls_policies.sql)
-- =============================================================================

-- === EXTENSIONS (001a) ===
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- === ENUMS (001a) ===
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('STUDENT', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.career_readiness AS ENUM ('EXPLORING', 'PREPARING', 'APPLYING', 'READY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.avatar_kind AS ENUM ('jazzicon', 'upload');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.skill_category AS ENUM ('TECH', 'SOFT', 'DOMAIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.proficiency_type AS ENUM ('SELF_ASSESSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.source_type AS ENUM ('FORMAL', 'INFORMAL', 'INSTITUTIONAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.opportunity_type AS ENUM (
    'INTERNSHIP', 'ENTRY_LEVEL', 'MICRO', 'RESEARCH', 'VOLUNTEER', 'GRADUATE_ROLE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.industry_type AS ENUM (
    'TECH', 'BUSINESS', 'LAW', 'FINANCE', 'HOSPITALITY', 'HEALTH', 'MEDIA', 'EDUCATION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.opportunity_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.match_feedback AS ENUM ('GOOD', 'BAD', 'NONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pathway_level AS ENUM ('ENTRY', 'MID', 'SENIOR', 'SPECIALIST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interaction_action AS ENUM (
    'VIEW', 'CLICK', 'SAVE', 'APPLY', 'DISLIKE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_interaction_action AS ENUM (
    'VIEWED', 'SAVED', 'APPLIED', 'RATED', 'SKIPPED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.learning_resource_source AS ENUM ('CURATED', 'SEARCH_LINK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === REFERENCE TABLES (001b) ===
CREATE TABLE IF NOT EXISTS public.skills (
  skill_id     BIGSERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL UNIQUE,
  category     public.skill_category NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pathway_roles (
  role_id      BIGSERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  level        public.pathway_level,
  industry     VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === OPPORTUNITY SOURCES (001c) ===
CREATE TABLE IF NOT EXISTS public.opportunity_sources (
  source_id    BIGSERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  source_type  public.source_type NOT NULL,
  url_or_path  VARCHAR(500),
  last_run_at  TIMESTAMPTZ,
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === AUTH-LINKED TABLES (001d, 001e) ===
-- profiles maps ER Users (minus email/password_hash → Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  phone_number     VARCHAR(20),
  full_name        VARCHAR(255),
  role             public.user_role NOT NULL DEFAULT 'STUDENT',
  status           public.user_status NOT NULL DEFAULT 'ACTIVE',
  avatar_kind      public.avatar_kind NOT NULL DEFAULT 'jazzicon',
  avatar_url       TEXT,
  jazzicon_seed    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  course     VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === M1 PROFILING (001f, 001g) ===
CREATE TABLE IF NOT EXISTS public.student_profiles (
  profile_id           BIGSERIAL PRIMARY KEY,
  student_id           BIGINT NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  year_of_study        INT CHECK (year_of_study BETWEEN 1 AND 5),
  career_readiness     public.career_readiness,
  bio                  TEXT,
  career_goal          VARCHAR(255),
  career_search_feedback TEXT,
  profile_completeness INT NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
  onboarded            BOOLEAN NOT NULL DEFAULT false,
  profile_embedding    vector(384),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_skills (
  id                BIGSERIAL PRIMARY KEY,
  profile_id        BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  skill_id          BIGINT NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  proficiency_type  public.proficiency_type NOT NULL DEFAULT 'SELF_ASSESSED',
  proficiency_level SMALLINT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.career_interests (
  id         BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  area       VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === M2 OPPORTUNITIES (001h) ===
CREATE TABLE IF NOT EXISTS public.opportunities (
  opportunity_id   BIGSERIAL PRIMARY KEY,
  source_id        BIGINT NOT NULL REFERENCES public.opportunity_sources(source_id) ON DELETE RESTRICT,
  title            VARCHAR(255) NOT NULL,
  organisation     VARCHAR(200),
  description      TEXT,
  type             public.opportunity_type,
  industry         public.industry_type,
  location         VARCHAR(150),
  experience_level INT CHECK (experience_level BETWEEN 1 AND 5),
  deadline         DATE,
  status           public.opportunity_status NOT NULL DEFAULT 'PENDING',
  embedding        vector(384),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opportunity_skills (
  opportunity_id BIGINT NOT NULL REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  skill_id       BIGINT NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, skill_id)
);

-- === M3 MATCHING (001i) ===
CREATE TABLE IF NOT EXISTS public.match_results (
  match_id          BIGSERIAL PRIMARY KEY,
  profile_id        BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  opportunity_id    BIGINT NOT NULL REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  relevance_score   DECIMAL(5, 2),
  rank              INT,
  feedback          public.match_feedback NOT NULL DEFAULT 'NONE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_score     DECIMAL(5, 4),
  collab_score      DECIMAL(5, 4),
  UNIQUE (profile_id, opportunity_id)
);

-- === M4 SKILLS GAP (001j) ===
CREATE TABLE IF NOT EXISTS public.skills_gap_analyses (
  analysis_id        BIGSERIAL PRIMARY KEY,
  profile_id         BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  opportunity_id     BIGINT REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  target_role        TEXT,
  pathway_role_id    BIGINT REFERENCES public.pathway_roles(role_id) ON DELETE SET NULL,
  required_skills    JSONB NOT NULL,
  gaps               JSONB NOT NULL,
  prioritised_plan   JSONB NOT NULL,
  report             JSONB NOT NULL DEFAULT '{}'::jsonb,
  methodology        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pathway_role_skills (
  role_id    BIGINT NOT NULL REFERENCES public.pathway_roles(role_id) ON DELETE CASCADE,
  skill_id   BIGINT NOT NULL REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, skill_id)
);

-- === M5 PATHWAY (001k) ===
CREATE TABLE IF NOT EXISTS public.career_pathways (
  pathway_id      BIGSERIAL PRIMARY KEY,
  profile_id      BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  target_role_id  BIGINT NOT NULL REFERENCES public.pathway_roles(role_id) ON DELETE RESTRICT,
  roadmap_data    JSONB NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === ADMIN (001l) ===
CREATE TABLE IF NOT EXISTS public.audit_logs (
  log_id         BIGSERIAL PRIMARY KEY,
  admin_id       BIGINT NOT NULL REFERENCES public.admins(id) ON DELETE RESTRICT,
  action         VARCHAR(255) NOT NULL,
  target_entity  VARCHAR(100),
  target_id      BIGINT,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === SUPPORT TABLES (001m) ===
CREATE TABLE IF NOT EXISTS public.profile_interactions (
  id           BIGSERIAL PRIMARY KEY,
  profile_id   BIGINT NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
  action       public.profile_interaction_action NOT NULL,
  target_type  VARCHAR(100) NOT NULL,
  target_id    BIGINT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_interactions (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id  BIGINT NOT NULL REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  action          public.interaction_action NOT NULL,
  weight          INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aggregation_runs (
  id           BIGSERIAL PRIMARY KEY,
  source_id    BIGINT NOT NULL REFERENCES public.opportunity_sources(source_id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  status       VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
  items_found  INT NOT NULL DEFAULT 0,
  errors       JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id  BIGINT NOT NULL REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS public.community_submissions (
  submission_id    BIGSERIAL PRIMARY KEY,
  submitter_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title            VARCHAR(255) NOT NULL,
  organisation     VARCHAR(200),
  description      TEXT,
  type             public.opportunity_type,
  industry         public.industry_type,
  location         VARCHAR(150),
  experience_level INT CHECK (experience_level BETWEEN 1 AND 5),
  deadline         DATE,
  status           public.submission_status NOT NULL DEFAULT 'PENDING',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_resources (
  id           BIGSERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  url          TEXT NOT NULL,
  skill_id     BIGINT REFERENCES public.skills(skill_id) ON DELETE SET NULL,
  source       public.learning_resource_source NOT NULL DEFAULT 'CURATED',
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pathway_edges (
  id                   BIGSERIAL PRIMARY KEY,
  from_role_id         BIGINT NOT NULL REFERENCES public.pathway_roles(role_id) ON DELETE CASCADE,
  to_role_id           BIGINT NOT NULL REFERENCES public.pathway_roles(role_id) ON DELETE CASCADE,
  difficulty           INT CHECK (difficulty BETWEEN 1 AND 5),
  typical_time_months  INT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_role_id, to_role_id)
);

-- === INDEXES (001n) ===
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON public.student_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_profile_id ON public.student_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill_id ON public.student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_career_interests_profile_id ON public.career_interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_source_id ON public.opportunities(source_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline ON public.opportunities(status, deadline);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill_id ON public.opportunity_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_match_results_profile_id ON public.match_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_match_results_opportunity_id ON public.match_results(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_match_results_profile_rank ON public.match_results(profile_id, rank);
CREATE INDEX IF NOT EXISTS idx_skills_gap_profile_id ON public.skills_gap_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_opportunity_id ON public.skills_gap_analyses(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_profile_created ON public.skills_gap_analyses(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pathway_role_skills_skill_id ON public.pathway_role_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_profile_id ON public.career_pathways(profile_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_target_role_id ON public.career_pathways(target_role_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_profile_id ON public.profile_interactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_opportunity_id ON public.user_interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_aggregation_runs_source_id ON public.aggregation_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_user_id ON public.saved_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_skill_id ON public.learning_resources(skill_id);
CREATE INDEX IF NOT EXISTS idx_pathway_edges_from_role ON public.pathway_edges(from_role_id);
CREATE INDEX IF NOT EXISTS idx_pathway_edges_to_role ON public.pathway_edges(to_role_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON public.skills(name);

CREATE INDEX IF NOT EXISTS idx_student_profiles_embedding
  ON public.student_profiles USING hnsw (profile_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_opportunities_embedding
  ON public.opportunities USING hnsw (embedding vector_cosine_ops);

-- === TRIGGERS (001o) ===
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_community_submissions_updated_at ON public.community_submissions;
CREATE TRIGGER trg_community_submissions_updated_at
  BEFORE UPDATE ON public.community_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
  display_name TEXT;
BEGIN
  assigned_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'STUDENT'::public.user_role
  );

  display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), '')
  );

  INSERT INTO public.profiles (
    id,
    email,
    phone_number,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN lower(trim(NEW.email)) ELSE NULL END,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone_number'), ''),
    display_name,
    assigned_role,
    'ACTIVE'::public.user_status
  );

  IF assigned_role = 'STUDENT'::public.user_role THEN
    INSERT INTO public.students (user_id, course)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'course');
  ELSIF assigned_role = 'ADMIN'::public.user_role THEN
    INSERT INTO public.admins (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'ADMIN'::public.user_role
      AND status = 'ACTIVE'::public.user_status
  );
$$;

-- Helper: get student profile_id for current auth user
CREATE OR REPLACE FUNCTION public.current_student_profile_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.profile_id
  FROM public.student_profiles sp
  JOIN public.students s ON s.id = sp.student_id
  WHERE s.user_id = auth.uid()
  LIMIT 1;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- =============================================================================
-- Dira — Row Level Security Policies
-- Run after 001_initial_schema.sql
-- TS backend using service role bypasses RLS
-- =============================================================================

-- === ENABLE RLS ===
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_role_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_edges ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- === STUDENTS / ADMINS ===
DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admins_select ON public.admins;
CREATE POLICY admins_select ON public.admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- === STUDENT PROFILES ===
DROP POLICY IF EXISTS student_profiles_select ON public.student_profiles;
CREATE POLICY student_profiles_select ON public.student_profiles
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS student_profiles_insert ON public.student_profiles;
CREATE POLICY student_profiles_insert ON public.student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS student_profiles_update ON public.student_profiles;
CREATE POLICY student_profiles_update ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  )
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

-- === STUDENT SKILLS & INTERESTS ===
DROP POLICY IF EXISTS student_skills_all ON public.student_skills;
CREATE POLICY student_skills_all ON public.student_skills
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  )
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS career_interests_all ON public.career_interests;
CREATE POLICY career_interests_all ON public.career_interests
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  )
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

-- === REFERENCE DATA (read all, admin write) ===
DROP POLICY IF EXISTS skills_select ON public.skills;
CREATE POLICY skills_select ON public.skills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS skills_admin_write ON public.skills;
CREATE POLICY skills_admin_write ON public.skills
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS pathway_roles_select ON public.pathway_roles;
CREATE POLICY pathway_roles_select ON public.pathway_roles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pathway_roles_admin_write ON public.pathway_roles;
CREATE POLICY pathway_roles_admin_write ON public.pathway_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS pathway_role_skills_select ON public.pathway_role_skills;
CREATE POLICY pathway_role_skills_select ON public.pathway_role_skills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pathway_role_skills_admin_write ON public.pathway_role_skills;
CREATE POLICY pathway_role_skills_admin_write ON public.pathway_role_skills
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS pathway_edges_select ON public.pathway_edges;
CREATE POLICY pathway_edges_select ON public.pathway_edges
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pathway_edges_admin_write ON public.pathway_edges;
CREATE POLICY pathway_edges_admin_write ON public.pathway_edges
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS learning_resources_select ON public.learning_resources;
CREATE POLICY learning_resources_select ON public.learning_resources
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS learning_resources_admin_write ON public.learning_resources;
CREATE POLICY learning_resources_admin_write ON public.learning_resources
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === OPPORTUNITIES ===
DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
CREATE POLICY opportunities_select ON public.opportunities
  FOR SELECT TO authenticated
  USING (status = 'APPROVED'::public.opportunity_status OR public.is_admin());

DROP POLICY IF EXISTS opportunities_admin_write ON public.opportunities;
CREATE POLICY opportunities_admin_write ON public.opportunities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS opportunity_skills_select ON public.opportunity_skills;
CREATE POLICY opportunity_skills_select ON public.opportunity_skills
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS opportunity_skills_admin_write ON public.opportunity_skills;
CREATE POLICY opportunity_skills_admin_write ON public.opportunity_skills
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS opportunity_sources_select ON public.opportunity_sources;
CREATE POLICY opportunity_sources_select ON public.opportunity_sources
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS opportunity_sources_admin_write ON public.opportunity_sources;
CREATE POLICY opportunity_sources_admin_write ON public.opportunity_sources
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === MATCHING & GAP ANALYSIS ===
DROP POLICY IF EXISTS match_results_select ON public.match_results;
CREATE POLICY match_results_select ON public.match_results
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS match_results_update_feedback ON public.match_results;
CREATE POLICY match_results_update_feedback ON public.match_results
  FOR UPDATE TO authenticated
  USING (profile_id = public.current_student_profile_id())
  WITH CHECK (profile_id = public.current_student_profile_id());

DROP POLICY IF EXISTS skills_gap_select ON public.skills_gap_analyses;
CREATE POLICY skills_gap_select ON public.skills_gap_analyses
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS skills_gap_insert ON public.skills_gap_analyses;
CREATE POLICY skills_gap_insert ON public.skills_gap_analyses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

-- === CAREER PATHWAYS ===
DROP POLICY IF EXISTS career_pathways_select ON public.career_pathways;
CREATE POLICY career_pathways_select ON public.career_pathways
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS career_pathways_insert ON public.career_pathways;
CREATE POLICY career_pathways_insert ON public.career_pathways
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS career_pathways_update ON public.career_pathways;
CREATE POLICY career_pathways_update ON public.career_pathways
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  )
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

-- === INTERACTIONS & SAVED ===
DROP POLICY IF EXISTS profile_interactions_all ON public.profile_interactions;
CREATE POLICY profile_interactions_all ON public.profile_interactions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  )
  WITH CHECK (
    public.is_admin()
    OR profile_id = public.current_student_profile_id()
  );

DROP POLICY IF EXISTS user_interactions_all ON public.user_interactions;
CREATE POLICY user_interactions_all ON public.user_interactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS saved_opportunities_all ON public.saved_opportunities;
CREATE POLICY saved_opportunities_all ON public.saved_opportunities
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- === COMMUNITY SUBMISSIONS ===
DROP POLICY IF EXISTS community_submissions_select ON public.community_submissions;
CREATE POLICY community_submissions_select ON public.community_submissions
  FOR SELECT TO authenticated
  USING (submitter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_submissions_insert ON public.community_submissions;
CREATE POLICY community_submissions_insert ON public.community_submissions
  FOR INSERT TO authenticated
  WITH CHECK (submitter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_submissions_admin_update ON public.community_submissions;
CREATE POLICY community_submissions_admin_update ON public.community_submissions
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === ADMIN-ONLY ===
DROP POLICY IF EXISTS audit_logs_admin ON public.audit_logs;
CREATE POLICY audit_logs_admin ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS aggregation_runs_admin ON public.aggregation_runs;
CREATE POLICY aggregation_runs_admin ON public.aggregation_runs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

DROP POLICY IF EXISTS students_update_own ON public.students;
CREATE POLICY students_update_own ON public.students
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- === 005 profile avatars (storage) ===
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- === 006 user job views (apply / link history) ===
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
