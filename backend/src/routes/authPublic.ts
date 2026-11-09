import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { createServiceClient } from '../lib/supabase.js'
import { kenyaPhoneLookupVariants, normalizeKenyaPhone } from '../lib/kenyaPhone.js'
import { throwIfError } from '../lib/helpers.js'
import { ensureProfileForAuthUser } from '../lib/ensureProfile.js'

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

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  fullName: z.string().min(1).max(255),
  phone: z.string().min(1).max(32),
})

authPublicRouter.post(
  '/signup',
  asyncHandler(async (req, res) => {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new HttpError(
        503,
        'Server-assisted signup requires SUPABASE_SERVICE_ROLE_KEY on the API server.'
      )
    }

    const body = signupSchema.parse(req.body ?? {})
    const normalizedPhone = normalizeKenyaPhone(body.phone)
    if (!normalizedPhone) {
      throw new HttpError(400, 'Invalid Kenyan phone number')
    }

    if (await emailTaken(body.email)) {
      throw new HttpError(409, 'This email already exists')
    }
    if (await phoneTaken(normalizedPhone)) {
      throw new HttpError(409, 'This phone number is already registered')
    }

    const service = createServiceClient()
    const { data: created, error } = await service.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.fullName.trim(),
        phone_number: normalizedPhone,
        role: 'STUDENT',
      },
    })

    if (error) {
      throw new HttpError(400, error.message)
    }

    const authUser = created.user
    if (!authUser) {
      throw new HttpError(500, 'User creation failed')
    }

    const { data: profileRow } = await service
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle()

    if (!profileRow) {
      await ensureProfileForAuthUser(authUser)
    }

    res.status(201).json({
      data: {
        userId: authUser.id,
        email: authUser.email,
      },
    })
  })
)
