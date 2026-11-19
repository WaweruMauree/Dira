import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { signInStudent } from './auth'
import { completeOnboarding } from './onboarding'

const SUPABASE_STORAGE_KEYS = ['dira-auth-student', 'dira-auth-admin']

export async function clearAuth(page: Page) {
  await page.context().clearCookies()
  await page.goto('/')
  await page.evaluate((keys) => {
    for (const key of keys) {
      localStorage.removeItem(key)
    }
    localStorage.clear()
    sessionStorage.clear()
  }, SUPABASE_STORAGE_KEYS)
}

async function waitForProfileShell(page: Page) {
  const loading = page.getByText(/Loading your profile/i)
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: 'hidden', timeout: 120_000 })
  }
}

export async function assertStudentOnboarded(page: Page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const meWait = page
      .waitForResponse(
        (res) => res.url().includes('/api/v1/me') && res.request().method() === 'GET',
        { timeout: 120_000 }
      )
      .catch(() => null)

    if (!page.url().includes('/profile')) {
      await page.goto('/profile')
    } else if (attempt > 0) {
      await page.reload()
    }
    await page.waitForLoadState('domcontentloaded')
    await meWait

    if (page.url().includes('/onboarding')) {
      throw new Error('Student is not onboarded (redirected to onboarding).')
    }

    await waitForProfileShell(page)

    const heading = page.getByRole('heading', { name: 'Career progression' })
    if (await heading.isVisible().catch(() => false)) return
  }

  await expect(page.getByRole('heading', { name: 'Career progression' })).toBeVisible({
    timeout: 60_000,
  })
}

/** Re-signs in after T2 logout and finishes onboarding only when the server still requires it. */
export async function ensureOnboarded(page: Page) {
  await page.goto('/login')
  if (page.url().includes('/login')) {
    await signInStudent(page)
  }

  await page.goto('/profile')
  await page.waitForLoadState('domcontentloaded')

  if (page.url().includes('/onboarding')) {
    await completeOnboarding(page)
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
  }

  await assertStudentOnboarded(page)
}