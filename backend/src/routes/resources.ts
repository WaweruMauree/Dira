import { Router } from 'express'
import { resourceRouter } from '../lib/resourceRouter.js'
import { junctionRouter } from '../lib/junctionRouter.js'

export function mountResourceRoutes(api: Router) {
  api.use(
    '/profiles',
    resourceRouter({ table: 'profiles', pk: 'id', extraFilters: ['role', 'status'] })
  )
  api.use(
    '/students',
    resourceRouter({ table: 'students', pk: 'id', extraFilters: ['user_id'] })
  )
  api.use('/admins', resourceRouter({ table: 'admins', pk: 'id' }))
  api.use(
    '/student-profiles',
    resourceRouter({
      table: 'student_profiles',
      pk: 'profile_id',
      extraFilters: ['student_id', 'onboarded'],
    })
  )
  api.use(
    '/student-skills',
    resourceRouter({ table: 'student_skills', pk: 'id', extraFilters: ['profile_id', 'skill_id'] })
  )
  api.use(
    '/career-interests',
    resourceRouter({ table: 'career_interests', pk: 'id', extraFilters: ['profile_id'] })
  )
  api.use(
    '/skills',
    resourceRouter({
      table: 'skills',
      pk: 'skill_id',
      adminWrite: true,
      searchColumns: ['name'],
      extraFilters: ['category'],
      orderBy: 'name',
      orderAscending: true,
    })
  )
  api.use(
    '/pathway-roles',
    resourceRouter({
      table: 'pathway_roles',
      pk: 'role_id',
      adminWrite: true,
      searchColumns: ['title', 'industry'],
      extraFilters: ['level', 'industry'],
      orderBy: 'title',
      orderAscending: true,
    })
  )
  api.use(
    '/opportunity-sources',
    resourceRouter({
      table: 'opportunity_sources',
      pk: 'source_id',
      adminWrite: true,
      searchColumns: ['name'],
    })
  )
  api.use(
    '/opportunities',
    resourceRouter({
      table: 'opportunities',
      pk: 'opportunity_id',
      adminWrite: true,
      searchColumns: ['title', 'organisation', 'location'],
      extraFilters: ['status', 'type', 'industry', 'source_id'],
    })
  )
  api.use(
    '/match-results',
    resourceRouter({
      table: 'match_results',
      pk: 'match_id',
      extraFilters: ['profile_id', 'opportunity_id', 'feedback'],
    })
  )
  api.use(
    '/skills-gap-analyses',
    resourceRouter({
      table: 'skills_gap_analyses',
      pk: 'analysis_id',
      extraFilters: ['profile_id', 'opportunity_id'],
    })
  )
  api.use(
    '/career-pathways',
    resourceRouter({
      table: 'career_pathways',
      pk: 'pathway_id',
      extraFilters: ['profile_id', 'target_role_id'],
      orderBy: 'generated_at',
    })
  )
  api.use(
    '/audit-logs',
    resourceRouter({
      table: 'audit_logs',
      pk: 'log_id',
      adminWrite: true,
      extraFilters: ['admin_id'],
      orderBy: 'timestamp',
    })
  )
  api.use(
    '/profile-interactions',
    resourceRouter({
      table: 'profile_interactions',
      pk: 'id',
      extraFilters: ['profile_id', 'action', 'target_type'],
    })
  )
  api.use(
    '/user-interactions',
    resourceRouter({
      table: 'user_interactions',
      pk: 'id',
      stampUserId: true,
      extraFilters: ['user_id', 'opportunity_id', 'action'],
    })
  )
  api.use(
    '/aggregation-runs',
    resourceRouter({
      table: 'aggregation_runs',
      pk: 'id',
      adminWrite: true,
      extraFilters: ['source_id', 'status'],
      orderBy: 'started_at',
    })
  )
  api.use(
    '/saved-opportunities',
    resourceRouter({
      table: 'saved_opportunities',
      pk: 'id',
      stampUserId: true,
      extraFilters: ['user_id', 'opportunity_id'],
      orderBy: 'saved_at',
    })
  )
  api.use(
    '/community-submissions',
    resourceRouter({
      table: 'community_submissions',
      pk: 'submission_id',
      stampUserField: 'submitter_id',
      extraFilters: ['status', 'type', 'industry'],
      searchColumns: ['title', 'organisation'],
    })
  )
  api.use(
    '/learning-resources',
    resourceRouter({
      table: 'learning_resources',
      pk: 'id',
      adminWrite: true,
      searchColumns: ['title', 'description'],
      extraFilters: ['skill_id', 'source'],
    })
  )
  api.use(
    '/pathway-edges',
    resourceRouter({
      table: 'pathway_edges',
      pk: 'id',
      adminWrite: true,
      extraFilters: ['from_role_id', 'to_role_id'],
    })
  )

  api.use(
    '/opportunities/:id/skills',
    junctionRouter({
      table: 'opportunity_skills',
      parentKey: 'opportunity_id',
      childKey: 'skill_id',
      adminWrite: true,
    })
  )
  api.use(
    '/pathway-roles/:id/skills',
    junctionRouter({
      table: 'pathway_role_skills',
      parentKey: 'role_id',
      childKey: 'skill_id',
      adminWrite: true,
    })
  )
}
