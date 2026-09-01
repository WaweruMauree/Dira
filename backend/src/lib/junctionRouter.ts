import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/error.js'
import { requireAdmin } from '../middleware/auth.js'
import { throwIfError } from '../lib/helpers.js'

export function junctionRouter(opts: {
  table: string
  parentKey: string
  childKey: string
  adminWrite?: boolean
}): Router {
  const router = Router({ mergeParams: true })

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const parentId = z.coerce.number().int().parse(req.params.id)
      const { data, error } = await req.supabase.from(opts.table).select('*').eq(opts.parentKey, parentId)
      throwIfError(error)
      res.json({ data: data ?? [] })
    })
  )

  const postHandlers = opts.adminWrite ? [requireAdmin] : []
  router.post(
    '/',
    ...postHandlers,
    asyncHandler(async (req, res) => {
      const parentId = z.coerce.number().int().parse(req.params.id)
      const childId = z.coerce.number().int().parse(req.body?.[opts.childKey] ?? req.body?.skill_id)
      const { data, error } = await req.supabase
        .from(opts.table)
        .insert({ [opts.parentKey]: parentId, [opts.childKey]: childId } as never)
        .select('*')
        .single()
      throwIfError(error)
      res.status(201).json({ data })
    })
  )

  const deleteHandlers = opts.adminWrite ? [requireAdmin] : []
  router.delete(
    `/:${opts.childKey}`,
    ...deleteHandlers,
    asyncHandler(async (req, res) => {
      const parentId = z.coerce.number().int().parse(req.params.id)
      const childId = z.coerce.number().int().parse(req.params[opts.childKey])
      const { data, error } = await req.supabase
        .from(opts.table)
        .delete()
        .eq(opts.parentKey, parentId)
        .eq(opts.childKey, childId)
        .select(opts.childKey)
        .maybeSingle()
      throwIfError(error)
      if (!data) {
        res.status(404).json({ message: 'Not found' })
        return
      }
      res.status(204).send()
    })
  )

  return router
}
