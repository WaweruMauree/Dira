import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function selectCareerInterest(page: Page, interest: string) {
  const exact = page.getByRole('button', { name: interest, exact: true })
  if (await exact.isVisible().catch(() => false)) {
    await exact.click()
    return
  }
  const partial = page.getByRole('button').filter({ hasText: new RegExp(interest, 'i') }).first()
  await partial.click({ timeout: 30_000 })
}

export async function waitForSkillsGapTable(page: Page, timeoutMs = 180_000) {
  const table = page.getByRole('table')
  await expect(table).toBeVisible({ timeout: timeoutMs })
  await expect(table.getByText('Gap', { exact: true }).first()).toBeVisible({ timeout: timeoutMs })
}

export async function refreshSkillsAnalysis(page: Page) {
  const refresh = page.getByRole('button', { name: /Refresh analysis/i })
  if (await refresh.isVisible().catch(() => false)) {
    await refresh.click()
  }
}