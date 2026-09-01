import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { throwIfError } from '../lib/helpers.js'

export const pathwaysRouter = Router()

pathwaysRouter.get(
  '/map',
  asyncHandler(async (req, res) => {
    const targetRole = z.string().min(1).parse(req.query.targetRole)

    const { data: roles, error: roleError } = await req.supabase
      .from('pathway_roles')
      .select('*')
      .ilike('title', `%${targetRole}%`)
      .limit(8)
    throwIfError(roleError)
    if (!roles || roles.length === 0) {
      throw new HttpError(404, `No pathway roles matching "${targetRole}"`)
    }

    const roleIds = roles.map((r) => r.role_id as number)

    const { data: skills, error: skillError } = await req.supabase
      .from('pathway_role_skills')
      .select('role_id, skills (skill_id, name, category)')
      .in('role_id', roleIds)
    throwIfError(skillError)

    const { data: edges, error: edgeError } = await req.supabase
      .from('pathway_edges')
      .select('*')
      .or(`from_role_id.in.(${roleIds.join(',')}),to_role_id.in.(${roleIds.join(',')})`)
    throwIfError(edgeError)

    const extraIds = new Set<number>()
    for (const edge of edges ?? []) {
      extraIds.add(edge.from_role_id as number)
      extraIds.add(edge.to_role_id as number)
    }
    const missing = [...extraIds].filter((id) => !roleIds.includes(id))
    let extraRoles: typeof roles = []
    if (missing.length > 0) {
      const { data, error } = await req.supabase.from('pathway_roles').select('*').in('role_id', missing)
      throwIfError(error)
      extraRoles = data ?? []
    }

    const skillsByRole: Record<number, unknown[]> = {}
    for (const row of skills ?? []) {
      const rid = row.role_id as number
      if (!skillsByRole[rid]) skillsByRole[rid] = []
      skillsByRole[rid].push(row.skills)
    }

    res.json({
      data: {
        targetRole,
        roles: [...roles, ...extraRoles],
        skillsByRole,
        edges: edges ?? [],
      },
    })
  })
)
