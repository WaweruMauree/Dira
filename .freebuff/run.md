# Dira Frontend Preview — Run Doc

## How to reproduce artifacts
1. `cd frontend && npm install` — install dependencies
2. `npm run build` — produces `frontend/dist/` with bundled HTML/CSS/JS

## How to run the server
**Vite preview (recommended):**
```bash
cd frontend
./node_modules/.bin/vite preview --port 3456 --host 127.0.0.1
```

**Or via screen (detached):**
```bash
screen -dmS dira-server bash -c 'cd /path/to/frontend && ./node_modules/.bin/vite preview --port 3456 --host 127.0.0.1'
```

## Current server
- **Port:** 3456
- **Type:** Vite preview (serves production build with correct ES module MIME types)
- **Screen session:** `dira-server`
- **PID:** 12543 (lsof -i :3456 -t)
- **URL:** http://127.0.0.1:3456

## Tech stack
- React 19 + Vite 8
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- Google Fonts: Newsreader (headlines), Inter (UI), Space Mono (micro-labels)
- Custom theme colors: ground (#E8F1F8), accent (#F4D984), ink (#17161a), muted (#6b6a72)
