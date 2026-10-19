import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/error.js'
import { assertOpenRouterConfigured } from '../lib/openrouter.js'
import { getRubricsForSkills } from '../services/skillProficiencyRubrics.js'

const itemSchema = z.object({
  skillName: z.string().min(1).max(150),
  category: z.enum(['TECHNICAL', 'SOFT']),
})

const bodySchema = z.object({
  courseCatalogId: z.string().min(1).max(64),
  courseLabel: z.string().max(200).optional(),
  items: z.array(itemSchema).min(1).max(48),
})

export const skillsRubricsRouter = Router()

skillsRubricsRouter.post(
  '/proficiency-rubrics',
  asyncHandler(async (req, res) => {
    assertOpenRouterConfigured()
    const body = bodySchema.parse(req.body)
    const courseLabel = body.courseLabel?.trim() || body.courseCatalogId

    const rubrics = await getRubricsForSkills({
      courseCatalogId: body.courseCatalogId,
      courseLabel,
      items: body.items,
    })

    res.json({ rubrics })
  })
)
