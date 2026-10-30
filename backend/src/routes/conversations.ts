import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'

const modeSchema = z.enum(['general', 'career_guidance', 'job_aggregation'])

const createSchema = z.object({
  id: z.string().uuid().optional(),
  mode: modeSchema.default('general'),
  title: z.string().min(1).max(255).optional(),
  preview: z.string().optional(),
})

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  preview: z.string().nullable().optional(),
  mode: modeSchema.optional(),
})

export const conversationsRouter = Router()

conversationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', req.authUser.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)
    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

conversationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body ?? {})
    const insert: Record<string, unknown> = {
      user_id: req.authUser.id,
      mode: body.mode,
      title: body.title ?? 'New conversation',
      preview: body.preview ?? '',
    }
    if (body.id) insert.id = body.id
    const { data, error } = await req.supabase.from('conversations').insert(insert).select('*').single()
    throwIfError(error)
    res.status(201).json({ data })
  })
)

conversationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const { data, error } = await req.supabase.from('conversations').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Conversation not found')
    res.json({ data })
  })
)

conversationsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const body = patchSchema.parse(req.body ?? {})
    const { data, error } = await req.supabase
      .from('conversations')
      .update(body)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Conversation not found')
    res.json({ data })
  })
)

conversationsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const { data, error } = await req.supabase.from('conversations').delete().eq('id', id).select('id').maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Conversation not found')
    res.status(204).send()
  })
)

conversationsRouter.get(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const { data: conv, error: convError } = await req.supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    throwIfError(convError)
    if (!conv) throw new HttpError(404, 'Conversation not found')

    const { data, error } = await req.supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    throwIfError(error)
    res.json({ data: data ?? [] })
  })
)

const attachmentUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mime: z.string().min(1).max(128),
  kind: z.enum(['image', 'document']),
  dataBase64: z.string().min(1).max(1_400_000),
})

conversationsRouter.post(
  '/:id/attachments',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const body = attachmentUploadSchema.parse(req.body ?? {})

    const { data: conv, error: convError } = await req.supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    throwIfError(convError)
    if (!conv) throw new HttpError(404, 'Conversation not found')

    const fileId = randomUUID()
    const safeName = body.name.replace(/[^\w.-]+/g, '_').slice(0, 120)
    const path = `${req.authUser.id}/${id}/${fileId}-${safeName}`
    const buffer = Buffer.from(body.dataBase64, 'base64')

    const { error: uploadError } = await req.supabase.storage
      .from('chat-attachments')
      .upload(path, buffer, { contentType: body.mime, upsert: false })
    throwIfError(uploadError)

    const { data: signed, error: signError } = await req.supabase.storage
      .from('chat-attachments')
      .createSignedUrl(path, 3600)
    throwIfError(signError)

    res.status(201).json({
      data: {
        id: fileId,
        path,
        mime: body.mime,
        name: body.name,
        kind: body.kind,
        url: signed?.signedUrl ?? null,
      },
    })
  })
)

conversationsRouter.post(
  '/:id/messages',
  asyncHandler(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id)
    const body = z
      .object({
        role: z.enum(['user', 'assistant', 'tool', 'system']),
        content: z.string().default(''),
        tool_calls: z.unknown().optional(),
        tool_call_id: z.string().optional(),
        name: z.string().optional(),
      })
      .parse(req.body ?? {})

    const { data, error } = await req.supabase
      .from('conversation_messages')
      .insert({
        conversation_id: id,
        role: body.role,
        content: body.content,
        tool_calls: body.tool_calls ?? null,
        tool_call_id: body.tool_call_id ?? null,
        name: body.name ?? null,
      })
      .select('*')
      .single()
    throwIfError(error)
    res.status(201).json({ data })
  })
)
