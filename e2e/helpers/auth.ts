import type { Page } from '@playwright/test'
import { adminCredentials, studentCredentials } from '../fixtures/test-data'

export type SignUpInput = {
  email: string
  password: string
  fullName: string
  phoneNational: string
}

export async function waitForSignUpForm(page: Page) {
  await page.goto('/signup')
  await page.locator('#fullName').waitFor({ state: 'visible', timeout: 30_000 })
}

export async function fillSignUpForm(page: Page, input: SignUpInput) {
  await waitForSignUpForm(page)
  await page.locator('#fullName').fill(input.fullName)
  await page.locator('#phone').fill(input.phoneNational)
  await page.locator('#email').fill(input.email)
  await page.locator('#password').fill(input.password)
}

export async function submitSignUp(page: Page) {
  await page.getByRole('button', { name: 'Sign up', exact: true }).click()
  await page
    .getByText('Creating your account…')
    .waitFor({ state: 'hidden', timeout: 120_000 })
    .catch(() => {})
}

export async function signUpStudent(page: Page, input: SignUpInput = studentCredentials) {
  await fillSignUpForm(page, input)
  await submitSignUp(page)
}

export async function signInStudent(
  page: Page,
  email = studentCredentials.email,
  password = studentCredentials.password
) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/\/(home|onboarding|profile|login)/, { timeout: 90_000 })
}

export async function signInAdmin(page: Page) {
  if (!adminCredentials.email || !adminCredentials.password) {
    throw new Error('Admin credentials are not configured')
  }
  await page.goto('/login?account=admin')
  await page.locator('#email').fill(adminCredentials.email)
  await page.locator('#password').fill(adminCredentials.password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/\/admin/)
}

export async function signOutStudent(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/login/)
}

export function uniqueStudent(suffix: string): SignUpInput {
  const digits = suffix.replace(/\D/g, '').slice(-6) || String(Date.now() % 1_000_000)
  const phoneTail = String(Date.now() % 100_000_000).padStart(8, '0')
  return {
    email: `test.student.${digits}.${Date.now()}@gmail.com`,
    password: studentCredentials.password,
    fullName: `Test Student ${digits}`,
    phoneNational: `7${phoneTail}`,
  }
}