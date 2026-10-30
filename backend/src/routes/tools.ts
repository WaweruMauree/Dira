import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { hasExaKey, searchExaWithDepth } from '../lib/exa.js'
import { runCvBuilder } from '../services/cvBuilder.js'

export const toolsRouter = Router()

toolsRouter.post(
  '/web-search',
  asyncHandler(async (req, res) => {
    if (!hasExaKey()) {
      throw new HttpError(
        503,
        'Web search is not configured. Add EXA_API_KEY to backend/.env and restart the API.'
      )
    }
    const body = z
      .object({
        query: z.string().min(1).max(500),
        depth: z.enum(['quick', 'deep']).optional().default('quick'),
      })
      .parse(req.body ?? {})

    const results = await searchExaWithDepth(body.query, body.depth)
    res.json({
      data: {
        query: body.query,
        depth: body.depth,
        source: 'exa',
        results,
      },
    })
  })
)

toolsRouter.post(
  '/cv-builder',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        targetRole: z.string().min(1).max(200),
        title: z.string().min(1).max(255).optional(),
        extraContext: z.string().max(4000).optional(),
      })
      .parse(req.body ?? {})

    const data = await runCvBuilder({
      supabase: req.supabase,
      userId: req.authUser.id,
      profile: req.profile as Record<string, unknown>,
      targetRole: body.targetRole,
      title: body.title,
      extraContext: body.extraContext,
    })
    res.json({ data })
  })
)
