import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'
import { requireAdmin } from '../middleware/auth.js'

const idParam = z.object({ id: z.string().min(1) })

type ResourceOptions = {
  table: string
  pk: string
  adminWrite?: boolean
  stampUserId?: boolean
  stampUserField?: string
  searchColumns?: string[]
  extraFilters?: string[]
  orderBy?: string
  orderAscending?: boolean
}

export function resourceRouter(opts: ResourceOptions): Router {
  const router = Router()
  const {
    table,
    pk,
    adminWrite = false,
    stampUserId = false,
    stampUserField,
    searchColumns = [],
    extraFilters = [],
    orderBy = 'created_at',
    orderAscending = false,
  } = opts

  if (adminWrite) {
    router.post('/', requireAdmin)
    router.patch('/:id', requireAdmin)
    router.delete('/:id', requireAdmin)
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { limit, offset } = parsePaging(req)
      let query = req.supabase.from(table).select('*', { count: 'exact' })

      for (const key of extraFilters) {
        const value = req.query[key]
        if (typeof value === 'string' && value.length > 0) {
          query = query.eq(key, value)
        }
      }

      const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''
      if (search && searchColumns.length > 0) {
        const or = searchColumns.map((col) => `${col}.ilike.%${search}%`).join(',')
        query = query.or(or)
      }

      const { data, error, count } = await query
        .order(orderBy, { ascending: orderAscending })
        .range(offset, offset + limit - 1)
      throwIfError(error)
      res.json({ data: data ?? [], count: count ?? 0, limit, offset })
    })
  )

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const { id } = idParam.parse(req.params)
      const { data, error } = await req.supabase.from(table).select('*').eq(pk, id).maybeSingle()
      throwIfError(error)
      if (!data) {
        res.status(404).json({ message: 'Not found' })
        return
      }
      res.json({ data })
    })
  )

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>
      if (stampUserId) {
        body.user_id = req.authUser.id
      }
      if (stampUserField) {
        body[stampUserField] = req.authUser.id
      }
      const { data, error } = await req.supabase.from(table).insert(body).select('*').single()
      throwIfError(error)
      res.status(201).json({ data })
    })
  )

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const { id } = idParam.parse(req.params)
      const body = { ...(req.body ?? {}) } as Record<string, unknown>
      delete body[pk]
      if (stampUserId) {
        delete body.user_id
      }
      if (stampUserField) {
        delete body[stampUserField]
      }
      const { data, error } = await req.supabase.from(table).update(body).eq(pk, id).select('*').maybeSingle()
      throwIfError(error)
      if (!data) {
        res.status(404).json({ message: 'Not found' })
        return
      }
      res.json({ data })
    })
  )

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const { id } = idParam.parse(req.params)
      const { data, error } = await req.supabase.from(table).delete().eq(pk, id).select(pk).maybeSingle()
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
