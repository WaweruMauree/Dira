import type { TestInfo } from '@playwright/test'

export type ThesisEvidence = {
  testId: string
  requirementId: string
  expectedResult: string
  actualResult: string
  passFail: 'Pass' | 'Fail'
}

export async function attachThesisEvidence(testInfo: TestInfo, row: ThesisEvidence) {
  await testInfo.attach(`thesis-${row.testId}`, {
    body: JSON.stringify(row, null, 2),
    contentType: 'application/json',
  })
}