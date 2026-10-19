import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { createServiceClient } from '../lib/supabase.js'
import { kenyaPhoneLookupVariants, normalizeKenyaPhone } from '../lib/kenyaPhone.js'
import { throwIfError } from '../lib/helpers.js'

const availabilitySchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
  })
  .refine((body) => body.email !== undefined || body.phone !== undefined, {
    message: 'Provide email and/or phone',
  })

export const authPublicRouter = Router()

authPublicRouter.use(
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

async function emailTaken(email: string): Promise<boolean> {
  const service = createServiceClient()
  const normalized = email.trim().toLowerCase()

  const { data, error } = await service
    .schema('auth')
    .from('users')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()

  if (!error) {
    return Boolean(data)
  }

  let page = 1
  const perPage = 200
  for (;;) {
    const { data: listData, error: listError } = await service.auth.admin.listUsers({
      page,
      perPage,
    })
    if (listError) {
      throw new HttpError(503, listError.message)
    }
    const users = listData.users ?? []
    if (users.some((u) => u.email?.toLowerCase() === normalized)) {
      return true
    }
    if (users.length < perPage) return false
    page += 1
    if (page > 25) return false
  }
}

async function phoneTaken(phone: string): Promise<boolean> {
  const variants = kenyaPhoneLookupVariants(phone)
  if (variants.length === 0) return false

  const service = createServiceClient()
  const { data, error } = await service.from('profiles').select('id').in('phone_number', variants).limit(1)
  throwIfError(error)
  return (data?.length ?? 0) > 0
}

authPublicRouter.post(
  '/availability',
  asyncHandler(async (req, res) => {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(
        503,
        'Signup availability check requires SUPABASE_SERVICE_ROLE_KEY on the API server.'
      )
    }

    const body = availabilitySchema.parse(req.body)
    const result: { emailTaken?: boolean; phoneTaken?: boolean } = {}

    if (body.email !== undefined) {
      result.emailTaken = await emailTaken(body.email)
    }

    if (body.phone !== undefined) {
      if (!normalizeKenyaPhone(body.phone)) {
        throw new HttpError(400, 'Invalid Kenyan phone number')
      }
      result.phoneTaken = await phoneTaken(body.phone)
    }

    res.json(result)
  })
)
