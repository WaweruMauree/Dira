import { createServiceClient } from '../src/lib/supabase.js'
import { env } from '../src/config/env.js'

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim()
  const password = process.env.ADMIN_PASSWORD?.trim()
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Dira Admin'
  const phone = process.env.ADMIN_PHONE?.trim() || ''

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env')
    process.exit(1)
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required in backend/.env')
    process.exit(1)
  }

  const supabase = createServiceClient()

  const { count, error: countErr } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true })
  if (countErr) {
    console.error('Could not check admins table:', countErr.message)
    process.exit(1)
  }
  if ((count ?? 0) > 0) {
    console.log('An admin account already exists. Skipping create-admin.')
    process.exit(0)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'ADMIN',
      full_name: fullName,
      phone_number: phone || undefined,
    },
  })

  if (error) {
    console.error('Failed to create admin user:', error.message)
    process.exit(1)
  }

  console.log('Admin account created successfully.')
  console.log(`  Email: ${email}`)
  console.log(`  User id: ${data.user?.id}`)
  console.log('Log in at /login — you will be redirected to /admin')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
