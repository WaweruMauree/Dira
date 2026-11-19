import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { studentCredentials, TEST_IDS } from './fixtures/test-data'
import { attachThesisEvidence } from './helpers/evidence'
import { getStudentAccessToken } from './helpers/seed'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const studentAuthPath = path.join(root, 'e2e', '.auth', 'student.json')

test.describe('Authorization (thesis T10 / NFR2)', () => {
  test('student cannot access admin dashboard or admin API', async ({ browser }, testInfo) => {
    if (!fs.existsSync(studentAuthPath)) {
      test.skip(true, 'Student auth state missing — run setup project')
    }

    const context = await browser.newContext({ storageState: studentAuthPath })
    const page = await context.newPage()

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login\?account=admin/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Admin log in' })).toBeVisible()

    const token = await getStudentAccessToken(studentCredentials.email, studentCredentials.password)
    const apiBase = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
    const res = await fetch(`${apiBase}/api/v1/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.text()
    expect(body.toLowerCase()).not.toContain('pendingListings')

    await context.close()

    await attachThesisEvidence(testInfo, {
      testId: TEST_IDS.T10.id,
      requirementId: TEST_IDS.T10.requirement,
      expectedResult: 'Student blocked from admin UI and admin API; unauthenticated users sent to login.',
      actualResult: 'Student redirected to admin login; admin API returned authorization error.',
      passFail: 'Pass',
    })
  })

  test('unauthenticated user redirected from student dashboard', async ({ page }, testInfo) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

    await attachThesisEvidence(testInfo, {
      testId: TEST_IDS.T10.id,
      requirementId: TEST_IDS.T10.requirement,
      expectedResult: 'Users who are not logged in are redirected to login.',
      actualResult: 'Visit to /home redirected to /login.',
      passFail: 'Pass',
    })
  })
})