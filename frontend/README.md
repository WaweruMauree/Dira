# Dira Frontend

Career intelligence platform for university students — React 19 + Vite 8 + Tailwind CSS v4.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Live Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
| `VITE_AGENT_API_URL` | Express API base URL (default: `http://localhost:4000`) |
| `VITE_USE_MOCK_AGENT` | Set to `true` only for offline mock replies |
| `VITE_EXA_API_KEY` | Exa Search key for the in-browser `webSearch` tool |

When Supabase env vars are missing, auth runs in local dev mode (any email/password works). Onboarding, chats, and jobs otherwise go through the Express API.

## Agent

The model runs on the backend. Tools run in the browser (`src/lib/agent/tools`) and POST `toolResults` back to `/api/v1/agent/chat`.
