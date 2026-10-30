import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/error.js'
import { runAgentTurn } from '../services/agent.js'

const toolResult = z.object({
  toolCallId: z.string().min(1),
  name: z.string().min(1),
  output: z.unknown().optional(),
  error: z.string().optional(),
})

const attachmentSchema = z.object({
  name: z.string(),
  mime: z.string(),
  kind: z.enum(['image', 'document']),
  text: z.string().optional(),
  dataUrl: z.string().optional(),
  path: z.string().optional(),
  url: z.string().optional(),
})

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  chatId: z.string().uuid().optional(),
  mode: z.enum(['general', 'career_guidance', 'job_aggregation']).optional(),
  userMessage: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  tools: z.array(z.unknown()).optional(),
  toolResults: z.array(toolResult).optional(),
  profileContext: z.record(z.unknown()).optional(),
})

export const agentRouter = Router()

agentRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const body = chatSchema.parse(req.body ?? {})
    const result = await runAgentTurn({
      supabase: req.supabase,
      userId: req.authUser.id,
      body,
    })
    res.json(result)
  })
)
