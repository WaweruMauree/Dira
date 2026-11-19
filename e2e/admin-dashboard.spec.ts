import { test, expect } from '@playwright/test'
import { studentCredentials, TEST_IDS } from './fixtures/test-data'
import { attachThesisEvidence } from './helpers/evidence'
import {
  getStudentAccessToken,
  reactivateStudentByEmail,
  seedPendingOpportunities,
  studentCanListApprovedOpportunity,
} from './helpers/seed'
import { signInStudent } from './helpers/auth'

test.describe('Admin dashboard (thesis T8–T9)', () => {
  test('T8 / FR8 — Moderation approve and reject', async ({ page }, testInfo) => {
    const seed = await seedPendingOpportunities(
      `E2E Approve ${testInfo.testId}`,
      `E2E Reject ${testInfo.testId}`
    )

    await page.goto('/admin/moderation')
    await expect(page.getByText(seed.approveTitle)).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(seed.rejectTitle)).toBeVisible()

    const approveRow = page.locator('tr').filter({ hasText: seed.approveTitle })
    await approveRow.getByRole('button', { name: 'Approve' }).click()
    await expect(approveRow).toHaveCount(0, { timeout: 30_000 })

    const rejectRow = page.locator('tr').filter({ hasText: seed.rejectTitle })
    await rejectRow.getByRole('button', { name: 'Reject' }).click()
    await expect(rejectRow).toHaveCount(0, { timeout: 30_000 })

    await page.goto('/admin/audit-logs')
    await expect(page.getByText(/APPROVED opportunity/i).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/REJECTED opportunity/i).first()).toBeVisible()

    const token = await getStudentAccessToken(studentCredentials.email, studentCredentials.password)
    const approvedVisible = await studentCanListApprovedOpportunity(seed.approveTitle, token)
    expect(approvedVisible).toBe(true)

    const rejectVisible = await studentCanListApprovedOpportunity(seed.rejectTitle, token)
    expect(rejectVisible).toBe(false)

    await attachThesisEvidence(testInfo, {
      testId: TEST_IDS.T8.id,
      requirementId: TEST_IDS.T8.requirement,
      expectedResult:
        'Approved listing visible to students; rejected hidden; audit log records both actions.',
      actualResult:
        'Moderation updated rows; student API lists approved title only; audit log shows approve/reject.',
      passFail: 'Pass',
    })
  })

  test('T9 / FR9 — Suspend student account', async ({ page, browser }, testInfo) => {
    try {
      await page.goto('/admin/students')
      const search = page.getByPlaceholder('Search by name, email, or phone')
      await search.fill(studentCredentials.fullName)
      await search.press('Enter')
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/admin/students') && res.status() === 200,
        { timeout: 30_000 }
      ).catch(() => {})

      const row = page
        .getByRole('row')
        .filter({ hasText: studentCredentials.fullName })
        .filter({ has: page.getByRole('button', { name: 'Suspend' }) })
        .first()
      await expect(row).toBeVisible({ timeout: 60_000 })
      await row.getByRole('button', { name: 'Suspend' }).click()
      await expect(page.getByText('Account suspended')).toBeVisible({ timeout: 15_000 })
      const suspendedRow = page
        .getByRole('row')
        .filter({ hasText: studentCredentials.fullName })
        .first()
      await expect(suspendedRow.getByText('SUSPENDED')).toBeVisible({ timeout: 45_000 })

      await page.goto('/admin/audit-logs')
      await expect(page.getByText(/Set student status SUSPENDED/i).first()).toBeVisible({
        timeout: 60_000,
      })

      const studentContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const studentPage = await studentContext.newPage()
      await signInStudent(studentPage)
      const blocked =
        studentPage.url().includes('/login') ||
        (await studentPage.getByRole('alert').isVisible().catch(() => false))
      expect(blocked).toBeTruthy()
      await studentContext.close()

      await attachThesisEvidence(testInfo, {
        testId: TEST_IDS.T9.id,
        requirementId: TEST_IDS.T9.requirement,
        expectedResult: 'Status suspended, audit logged, student blocked with clear message.',
        actualResult: 'Student suspended in admin UI; audit log entry; student sign-in blocked.',
        passFail: 'Pass',
      })
    } finally {
      await reactivateStudentByEmail(studentCredentials.email)
    }
  })
})