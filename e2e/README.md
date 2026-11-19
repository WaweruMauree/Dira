# Dira thesis E2E (Playwright)

Maps test cases **T1–T10** to `student-dashboard.spec.ts`, `admin-dashboard.spec.ts`, and `authorization.spec.ts`.

## Prerequisites

1. `frontend/.env` and `backend/.env` with Supabase and API settings (see project READMEs).
2. `npm run create-admin` in `backend/` once.
3. For **T6–T7**, skills gap and pathway generation need a working backend; `OPENROUTER_API_KEY` in `backend/.env` avoids 402 errors on AI-assisted steps (seeded role analysis may still run without credits).
4. Setup (`auth.setup.ts`) reactivates the fixed student, completes onboarding when needed, and resets career profile to the thesis fixture so **T3** stays stable after **T4** profile edits.
5. Optional `e2e/.env` overrides:

- `E2E_STUDENT_EMAIL` (default `test.student@gmail.com`)
- `E2E_STUDENT_PASSWORD` (default `password`)
- `E2E_STUDENT_NAME`, `E2E_STUDENT_PHONE`
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (fallback: `ADMIN_*` in `backend/.env`)

## Commands (repo root)

```bash
npm install
npm run test:e2e:install
npm run test:e2e
npm run test:e2e:report
```

## Evidence

- HTML report: `e2e/report/`
- Failure screenshots: `e2e/test-results/`
- JSON thesis rows: attachments named `thesis-Tn` on each test