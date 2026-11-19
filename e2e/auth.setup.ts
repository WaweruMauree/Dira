import { test as setup, expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adminCredentials, studentCredentials } from './fixtures/test-data'
import { signInAdmin, signInStudent, signUpStudent } from './helpers/auth'
import { completeOnboarding } from './helpers/onboarding'
import { reactivateStudentByEmail, resetStudentOnboardingProfile } from './helpers/seed'
import { assertStudentOnboarded } from './helpers/session'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const studentAuth = path.join(root, 'e2e', '.auth', 'student.json')
const adminAuth = path.join(root, 'e2e', '.auth', 'admin.json')

setup('authenticate student', async ({ page }) => {
  await reactivateStudentByEmail(studentCredentials.email)

  await signInStudent(page)

  if (page.url().includes('/login')) {
    await signUpStudent(page)
    if (await page.getByText('This email already exists').isVisible().catch(() => false)) {
      await signInStudent(page)
    }
    await page.waitForURL(/\/(onboarding|home)/, { timeout: 90_000 })
  }

  if (page.url().includes('/onboarding')) {
    await completeOnboarding(page)
  } else {
    await resetStudentOnboardingProfile()
    await page.goto('/profile')
    await page.reload({ waitUntil: 'domcontentloaded' })
  }

  await assertStudentOnboarded(page)
  await page.context().storageState({ path: studentAuth })
})

setup('authenticate admin', async ({ page }) => {
  if (!adminCredentials.email) {
    throw new Error('Admin email not configured for E2E')
  }
  await signInAdmin(page)
  await expect(page).toHaveURL(/\/admin/)
  await page.context().storageState({ path: adminAuth })
})