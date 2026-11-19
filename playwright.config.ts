import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

const root = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(root, 'e2e', '.env') })
dotenv.config({ path: path.join(root, 'backend', '.env') })
dotenv.config({ path: path.join(root, 'frontend', '.env') })

const studentAuth = path.join(root, 'e2e', '.auth', 'student.json')
const adminAuth = path.join(root, 'e2e', '.auth', 'admin.json')

export default defineConfig({
  testDir: path.join(root, 'e2e'),
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 25_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(root, 'e2e', 'report'), open: 'never' }],
  ],
  globalSetup: path.join(root, 'e2e', 'global-setup.ts'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    ...devices['Desktop Chrome'],
  },
  projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'student',
      dependencies: ['setup'],
      testMatch: /student-dashboard\.spec\.ts/,
      use: { storageState: studentAuth },
    },
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: /admin-dashboard\.spec\.ts/,
      use: { storageState: adminAuth },
    },
    {
      name: 'authorization',
      dependencies: ['setup'],
      testMatch: /authorization\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.join(root, 'backend'),
      url: 'http://localhost:4000/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: path.join(root, 'frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})