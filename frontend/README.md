# Dira Frontend

Career intelligence platform for university students — React 19 + Vite 8 + Tailwind CSS v4.

## Setup (local dev)

Run the **API** and **frontend** together:

```bash
# Terminal 1 — Express API (port 4000)
cd backend
cp .env.example .env   # SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY for custom onboarding skills
npm install
npm run dev

# Terminal 2 — Vite (port 5173)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `FRONTEND_ORIGIN=http://localhost:5173` in `backend/.env` (default). Onboarding POST goes to `/api/v1/onboarding` via the Vite proxy when `VITE_AGENT_API_URL` is **empty**.

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_AGENT_API_URL` | API base URL. **Leave empty in local dev** to use same-origin `/api` proxy |
| `VITE_USE_MOCK_AGENT` | Set to `true` only for offline mock agent replies |
| `VITE_EXA_API_KEY` | Optional Exa key for in-browser web search tool |

Backend (`backend/.env`):

| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Required to persist **custom** skills added during onboarding |
| `FRONTEND_ORIGIN` | Must match Vite URL (default `http://localhost:5173`) |

If Complete Setup shows a network error, confirm the API is running and reachable. The UI shows an actionable message instead of raw "Failed to fetch".

## Routes

See onboarding at `/onboarding` after signup. Agent chat uses `POST /api/v1/agent/chat` on the backend.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run lint` — oxlint
