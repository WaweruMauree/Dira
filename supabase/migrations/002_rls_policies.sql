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
