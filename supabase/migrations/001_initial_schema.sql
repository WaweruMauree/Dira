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
  phone_number     VARCHAR(20),
  username         VARCHAR(255),
  full_name        VARCHAR(255),
  role             public.user_role NOT NULL DEFAULT 'STUDENT',
  status           public.user_status NOT NULL DEFAULT 'ACTIVE',
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
  opportunity_id     BIGINT NOT NULL REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE,
  required_skills    JSONB NOT NULL,
  gaps               JSONB NOT NULL,
  prioritised_plan   JSONB NOT NULL,
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
BEGIN
  assigned_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'STUDENT'::public.user_role
  );

  INSERT INTO public.profiles (
    id,
    phone_number,
    username,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
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
