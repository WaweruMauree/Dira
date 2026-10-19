-- Allow students to update their own career pathway work plans

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
