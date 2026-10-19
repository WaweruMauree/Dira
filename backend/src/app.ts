import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { errorMiddleware } from './middleware/error.js'
import { requireAuth } from './middleware/auth.js'
import { meRouter } from './routes/me.js'
import { onboardingRouter } from './routes/onboarding.js'
import { conversationsRouter } from './routes/conversations.js'
import { userJobsRouter } from './routes/userJobs.js'
import { cvsRouter } from './routes/cvs.js'
import { salaryEstimatesRouter } from './routes/salaryEstimates.js'
import { pathwaysRouter } from './routes/pathways.js'
import { skillsGapRouter } from './routes/skillsGap.js'
import { careerPathwaysRouter } from './routes/careerPathways.js'
import { skillsRubricsRouter } from './routes/skillsRubrics.js'
import { agentRouter } from './routes/agent.js'
import { mountResourceRoutes } from './routes/resources.js'
import { adminRouter } from './routes/admin.js'
import { authPublicRouter } from './routes/authPublic.js'
import { hasOpenRouter } from './lib/openrouter.js'
import { hasExaKey } from './lib/exa.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    })
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  )

  app.use('/api/v1/auth', authPublicRouter)

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'dira-api',
      time: new Date().toISOString(),
      features: {
        openRouter: hasOpenRouter(),
        exa: hasExaKey(),
      },
    })
  })

  const api = express.Router()
  api.use(requireAuth)
  api.use('/me', meRouter)
  api.use('/onboarding', onboardingRouter)
  api.use('/conversations', conversationsRouter)
  api.use('/user-jobs', userJobsRouter)
  api.use('/cvs', cvsRouter)
  api.use('/salary-estimates', salaryEstimatesRouter)
  api.use('/pathways', pathwaysRouter)
  api.use('/skills-gap', skillsGapRouter)
  api.use('/career-pathways', careerPathwaysRouter)
  api.use('/skills', skillsRubricsRouter)
  api.use('/agent', agentRouter)
  api.use('/admin', adminRouter)
  mountResourceRoutes(api)
  api.use((req, res) => {
    res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` })
  })

  app.use('/api/v1', api)
  app.use(errorMiddleware)
  return app
}
