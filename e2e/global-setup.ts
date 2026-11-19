import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

dotenv.config({ path: path.join(root, 'e2e', '.env') })
dotenv.config({ path: path.join(root, 'backend', '.env') })
dotenv.config({ path: path.join(root, 'frontend', '.env') })
const authDir = path.join(root, 'e2e', '.auth')

function requireEnv(name: string, hint: string): string {
  const v = process.env[name]?.trim()
  if (!v) {
    throw new Error(
      `E2E prerequisite missing: ${name}\n${hint}\nSet values in frontend/.env, backend/.env, and optional e2e/.env`
    )
  }
  return v
}

export default async function globalSetup() {
  fs.mkdirSync(authDir, { recursive: true })

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  const supabaseAnon =
    process.env.VITE_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl) {
    throw new Error('E2E prerequisite missing: VITE_SUPABASE_URL or SUPABASE_URL')
  }
  if (!supabaseAnon) {
    throw new Error('E2E prerequisite missing: VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY')
  }
  process.env.VITE_SUPABASE_URL = supabaseUrl
  process.env.SUPABASE_URL = process.env.SUPABASE_URL?.trim() || supabaseUrl
  process.env.VITE_SUPABASE_ANON_KEY = supabaseAnon
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'backend/.env needs SUPABASE_SERVICE_ROLE_KEY for onboarding and seeds')
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', 'backend/.env needs SUPABASE_SERVICE_ROLE_KEY for onboarding and seeds')

  const adminEmail = process.env.E2E_ADMIN_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim()
  const adminPassword = process.env.E2E_ADMIN_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim()
  if (!adminEmail || !adminPassword) {
    throw new Error(
      'E2E admin credentials missing. Set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD or ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env (run npm run create-admin first).'
    )
  }
}