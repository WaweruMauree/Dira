import { env } from '../src/config/env.js'
import { createServiceClient } from '../src/lib/supabase.js'

function fail(message: string): never {
  console.error(`[check-signup] ${message}`)
  process.exit(1)
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const service = createServiceClient()
  const probe = await service.from(table).select(column).limit(0)
  if (!probe.error) return true
  if (probe.error.code === '42703' || /does not exist/i.test(probe.error.message ?? '')) {
    return false
  }
  fail(`Cannot probe ${table}.${column}: ${probe.error.message}`)
}

async function testCreateUser(): Promise<void> {
  const service = createServiceClient()
  const email = `signup-probe-${Date.now()}@example.invalid`
  const { data, error } = await service.auth.admin.createUser({
    email,
    password: 'probe-pass-123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Signup Probe',
      phone_number: '+254700000001',
      role: 'STUDENT',
    },
  })
  if (error) {
    fail(
      `Auth createUser failed (${error.message}). ` +
        'In Supabase SQL Editor run migrations/015_signup_profiles_repair.sql (then 014 if profiles.username exists).'
    )
  }
  const userId = data.user?.id
  if (userId) {
    await service.auth.admin.deleteUser(userId)
  }
}

async function main() {
  if (!env.SUPABASE_URL) fail('SUPABASE_URL is not set')
  if (!env.SUPABASE_SERVICE_ROLE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY is not set (required for signup checks)')
  if (!env.SUPABASE_ANON_KEY) fail('SUPABASE_ANON_KEY is not set')

  const service = createServiceClient()
  const { error: profilesErr } = await service
    .from('profiles')
    .select('id, email, full_name, phone_number')
    .limit(1)
  if (profilesErr) {
    fail(`Cannot read profiles: ${profilesErr.message} (${profilesErr.code ?? 'unknown'})`)
  }

  const hasAvatarKind = await columnExists('profiles', 'avatar_kind')
  if (!hasAvatarKind) {
    fail(
      'profiles.avatar_kind is missing — run supabase/migrations/015_signup_profiles_repair.sql in the Supabase SQL Editor (includes migration 005 avatar DDL).'
    )
  }

  const usernameExists = await columnExists('profiles', 'username')
  if (usernameExists) {
    console.warn('[check-signup] profiles.username still exists — run migrations/014_drop_profiles_username.sql when ready')
  }

  await testCreateUser()
  console.log('[check-signup] OK: Supabase reachable, signup probe user created and removed')
}

main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err))
})
