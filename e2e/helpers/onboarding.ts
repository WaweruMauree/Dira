import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { onboardingProfile } from '../fixtures/test-data'

async function selectRadixOption(page: Page, triggerSelector: string, optionPattern: RegExp) {
  await page.locator(triggerSelector).click()
  await page.getByRole('option', { name: optionPattern }).click()
}

async function toggleSkillWithLevel(
  page: Page,
  skillName: string,
  sectionTitle: RegExp,
  levelLabel: string
) {
  const section = page.locator('div').filter({ has: page.getByRole('heading', { name: sectionTitle }) })
  const row = section.locator('div.rounded-lg.border').filter({ hasText: skillName })
  const checkbox = row.getByRole('checkbox', { name: skillName })
  if (!(await checkbox.isChecked())) {
    await checkbox.click()
  }
  await row.getByRole('button', { name: levelLabel }).click()
}

async function addCustomInterest(page: Page, interest: string) {
  const existing = page.getByRole('button').filter({ hasText: interest }).first()
  if (await existing.isVisible().catch(() => false)) {
    const badge = page.getByText(interest, { exact: true }).first()
    if (await badge.isVisible()) return
  }
  await page.getByRole('button', { name: 'Add interest' }).click()
  await page.getByPlaceholder('Your career interest').fill(interest)
  await page.getByRole('button', { name: 'Add', exact: true }).click()
}

/** Walk onboarding wizard using thesis test data (BBIT, year 3, skills, interests). */
export async function completeOnboarding(page: Page) {
  await page.waitForURL(/\/onboarding/, { timeout: 60_000 })

  await selectRadixOption(page, '#course', /Business Information Technology \(BBIT\)/)
  await selectRadixOption(page, '#year', /Year 3/)

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('heading', { name: 'Technical skills' }).waitFor({ timeout: 60_000 })
  await toggleSkillWithLevel(page, 'SQL', /Technical skills/, 'Intermediate')
  await toggleSkillWithLevel(page, 'Communication', /Soft skills/, 'Expert')

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('heading', { name: 'Career direction' }).waitFor()
  for (const interest of onboardingProfile.careerInterests) {
    const preset = page.getByRole('button').filter({ hasText: interest }).first()
    if (await preset.isVisible().catch(() => false)) {
      await preset.click()
    } else {
      await addCustomInterest(page, interest)
    }
  }
  await page.getByRole('radio', { name: /Exploring/ }).click()

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('heading', { name: 'Your job search so far' }).waitFor()

  const saveResponse = page.waitForResponse(
    (res) => res.url().includes('/api/v1/onboarding') && res.request().method() === 'POST',
    { timeout: 120_000 }
  )
  await page.getByRole('button', { name: 'Complete setup' }).click()
  const response = await saveResponse
  if (!response.ok()) {
    const body = await response.text().catch(() => '')
    throw new Error(`Onboarding API failed (${response.status()}): ${body.slice(0, 300)}`)
  }

  await page.waitForURL(/\/home/, { timeout: 120_000 })
  const errorAlert = page.locator('[role=alert]').filter({ hasText: /fail|error|whoops/i })
  await expect(errorAlert).toHaveCount(0)
}

export async function ensureOnHome(page: Page) {
  if (!page.url().includes('/home')) {
    await page.goto('/home')
    await page.waitForURL(/\/home/)
  }
}