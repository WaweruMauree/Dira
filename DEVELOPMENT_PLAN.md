# Development Plan — Web-Based ML & NLP Tool for Personalised Career Guidance (Strathmore University)

**Project:** A Web-Based Machine Learning and NLP-Based Tool for Personalised Career Guidance Among Students at Strathmore University
**Student:** Waweru, Maureen Wangui (168663, BBIT 4C)
**Supervisor:** Ms. Faith Siva
**Development window:** mid-August 2026 → end of November 2026 (~15 weeks)
**Methodology:** Object-Oriented Analysis & Design (OOAD) + Scrumban (Kanban on GitHub Projects)
**Source of truth:** SIVA-168663-Proposal (Final).docx

This document is the master guide for the development phase. Feed it (whole or phase-by-phase) to your prompt engine / coding agent. Every phase has a goal, a task checklist, required files, acceptance criteria, and Kanban cards.

---

## 1. Project Summary

Kenya's graduate labour market suffers from information asymmetry: many internships, entry-level roles and micro-opportunities circulate through informal channels (WhatsApp groups, alumni networks, lecturer contacts) that first-generation students cannot access. Existing platforms (LinkedIn, Fuzu, BrighterMonday, Ajira Digital) serve career-ready, well-connected users and offer no adaptive profiling, skills-gap analysis, or career-pathway guidance.

The project builds a web application with **five functional modules** that give a Strathmore undergraduate student a personalised, actionable development plan:

| # | Module | One-line purpose |
|---|--------|------------------|
| M1 | **Adaptive Career Profiling** | Collect and continuously refine the student's academic background, skills, interests and readiness level. |
| M2 | **Opportunity Aggregation** | NLP pipeline that extracts and structures opportunities from formal AND informal sources. |
| M3 | **Personalised Matching Engine** | Hybrid ML (content-based + collaborative filtering) ranked opportunity feed. |
| M4 | **Skills Gap Analysis** | Compare required skills of a target role vs. the student's skills; produce a prioritised development plan. |
| M5 | **Career Pathway Visualisation** | Interactive roadmap from the student's current position to target roles. |

**Actors:** Undergraduate Student (primary), System Administrator.

**Users:** Undergraduates across Strathmore's seven schools — SBS, School of Law, SCES, SHSS, STH, SIMS, and SIMT.

---

## 2. Technology Stack (fixed decisions)

| Layer | Choice | Notes |
|-------|--------|-------|
| Backend language | Python 3.12+ | |
| Backend framework | Django 5.x + Django REST Framework | ORM handles PostgreSQL; session/auth, serializers, routing |
| Frontend | React 18 + Vite (not CRA) | Component-based; maps cleanly to the 5 modules |
| Frontend routing | React Router (v6/v7) | All routes in Section 5 |
| HTTP client | Axios | Central API client with JWT interceptor |
| Styling | Tailwind CSS (or plain CSS modules if preferred) | Responsive, mobile-friendly |
| Database | PostgreSQL 16 | Managed entirely through Django ORM |
| Auth | djangorestframework-simplejwt (JWT access + refresh) | React SPA friendly |
| ML / NLP | scikit-learn, pandas, numpy, spaCy, sentence-transformers, huggingface `transformers`, `surprise` | All CPU-friendly; no GPU required |
| LLM runtime | **Ollama** running a local open model (e.g., `llama3.2:3b` or `mistral:7b`) | Free, offline, no paid APIs (per proposal delimitation); fallback to rule-based extraction when unavailable |
| Visualisation | `@xyflow/react` (React Flow) for the pathway roadmap | Interactive graphs |
| Scraping | requests + BeautifulSoup (rate-limited, robots.txt-aware) | Plus manual CSV/JSON import & admin entry (ToS-safe) |
| API docs | drf-spectacular (Swagger UI) | Auto-generated |
| Testing | pytest + DRF APIClient (unit/integration), **Playwright** (system/E2E) | |
| Background jobs | Django management commands + optional cron/APScheduler | Keep simple; no Celery initially |
| Environment | python-dotenv, `.env` file, `requirements.txt` | |
| Version control / PM | GitHub + GitHub Projects (Kanban) | |
| IDE | VS Code | |

**Non-negotiable constraints:**
- No paid commercial APIs (proposal delimitation).
- No GPU required; all models must run on a typical laptop (CPU, ≤ a few GB RAM).
- Web-only, responsive (mobile browsers supported), no native app.

---

## 3. System Architecture

Three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT LAYER — React.js (Vite)                              │
│  Pages: Landing, Auth, Onboarding, Dashboard, Opportunities,│
│  Matches, Skills Gap, Pathway, Admin (Section 5)            │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / JSON (REST, JWT)
┌───────────────────────────┴─────────────────────────────────┐
│ APPLICATION & API LAYER — Django REST Framework             │
│  Auth · Serializers · Business logic                        │
│  M1 Profiling engine · M2 NLP pipeline (spaCy + Ollama)     │
│  M3 Matching engine (sklearn + surprise) · M4 Gap analysis  │
│  M5 Pathway data service · Admin/approval workflows         │
└───────────────────────────┬─────────────────────────────────┘
                            │ Django ORM
┌───────────────────────────┴─────────────────────────────────┐
│ DATA LAYER — PostgreSQL                                     │
│  users, profiles, skills, opportunities, sources, matches,  │
│  gap analyses, pathway graph, interactions, feedback        │
└─────────────────────────────────────────────────────────────┘
```

**Module data flow (development & runtime order):**

```
M1 Profile ──────────────► M3 Matching ──► ranked feed ─┐
     │                      ▲                          │
     ▼                      │                          ▼
M2 Aggregated opportunities ┘                    M5 Pathway (combines 1,3,4)
     │                                              ▲
     ▼                                              │
M4 Skills Gap Analysis ────► development plan ───────┘
```

Dependencies: M3 needs M1+M2. M4 needs M1+M2. M5 needs M1, M3, M4. Therefore build order is **M1 → M2 → M3 → M4 → M5**, exactly as the proposal states.

---

## 3.5 Design Diagrams (Chapter 4 Deliverables)

All diagrams are in `docs/diagrams/` as **editable SVG files** (black lines/text on white background, matching your reference style). Open in draw.io / diagrams.net / Inkscape to edit.

| Diagram | File | Purpose |
|---------|------|---------|
| Use Case | `use-case-diagram.svg` | Actors (Student, Admin) and all system use cases with include/extend relationships |
| Class | `class-diagram.svg` | All Django model classes with attributes, methods, and inheritance/composition relationships |
| Entity Relationship | `er-diagram.svg` | Database entities with PK/FK, data types, and crow's-foot cardinality |
| Sequence (×3) | `sequence-diagram.svg` | Three key flows: (1) Onboarding & Profile Creation, (2) Personalised Matching, (3) Skills Gap Analysis |
| Database Schema | `database-schema.svg` | Clean database table layout with column types and foreign keys |
| Activity | `activity-diagram.svg` | End-to-end student journey from sign-up through pathway visualisation |
| Database Schema | `database-schema.svg` | Clean database table layout with column types and foreign keys |

**Regenerate after schema changes:** keep these diagrams in sync with the implemented models (Phase 1).

---

## 4. Data Model (Django models — implement in Phase 1)

All in the PostgreSQL database via Django ORM. Core apps: `accounts`, `profiles`, `opportunities`, `matching`, `gapanalysis`, `pathway`, `adminpanel`.

### 4.1 accounts
- `User(AbstractUser)` — email unique; `role` (STUDENT / ADMIN); `school` (FK to School or CharField); `year_of_study` (1–4/5); `is_active`.
- `School` — name (e.g., SCES), code.

### 4.2 profiles (M1)
- `StudentProfile` (1-1 User) — `programme`, `school` FK, `year_of_study`, `career_readiness_level` (EXPLORING / PREPARING / APPLYING / READY), `headline`, `bio`, `career_goal`, `location_pref`, `profile_completeness` (0–100, computed), `onboarding_completed` (bool).
- `Skill` — `name`, `category` (TECHNICAL / SOFT / DOMAIN), `esco_id` (nullable, links ESCO taxonomy), `aliases` (JSON list for matching).
- `StudentSkill` (profile FK, skill FK) — `self_assessed_level` (1–5), `confidence`, `verified` (bool, set when evidenced by interaction/assessment).
- `CareerInterest` (profile FK) — `area` (e.g., Data Science, Product Management, Legal Tech), `priority`.
- `ProfileInteraction` (profile FK) — `action` (VIEWED / SAVED / APPLIED / RATED / SKIPPED), `target_type`, `target_id`, `timestamp`. Feeds adaptive updates + collaborative filtering.

### 4.3 opportunities (M2)
- `Opportunity` — `title`, `organisation`, `description` (full text), `type` (INTERNSHIP / ENTRY_LEVEL / MICRO / RESEARCH / VOLUNTEER / GRADUATE_ROLE / OTHER), `industry` (TECH / BUSINESS / LAW / FINANCE / HOSPITALITY / HEALTH / MEDIA / EDUCATION / OTHER), `location` (incl. REMOTE), `experience_level` (1–5), `deadline`, `stipend` (nullable), `source_type` (FORMAL / INFORMAL / INSTITUTIONAL), `source_url`, `raw_text` (original unstructured text), `posted_date`, `status` (PENDING / APPROVED / REJECTED / EXPIRED), `created_by` (admin or submitter), `skills` (M2M Skill), `embedding` (JSONB vector of description, optional), `dedupe_hash`.
- `OpportunitySource` — `name`, `source_type`, `url_or_path`, `config` (JSON), `last_run_at`, `last_status`, `items_found`.
- `AggregationRun` — `source` FK, `started_at`, `finished_at`, `status`, `items_found`, `errors` (JSON).
- `CommunitySubmission` — opportunity fields + `submitter` (user, nullable), `status` (PENDING review).

### 4.4 matching (M3)
- `MatchResult` (profile FK, opportunity FK) — `score` (0–1), `rank`, `content_score`, `collab_score`, `model_version`, `created_at`, `expires_at` (cache TTL ~24h).
- `UserInteraction` (user FK, opportunity FK) — `action` (VIEW / CLICK / SAVE / APPLY / DISLIKE), `timestamp`, `weight`.
- `RecommendationFeedback` (user FK, opportunity FK) — `is_relevant` (bool) or 1–5 rating, `created_at`. Online feedback signal.

### 4.5 gapanalysis (M4)
- `SkillGapAnalysis` (profile FK) — `target_role` (CharField or FK to PathwayRole), `required_skills` (JSON: skill, min_level), `gaps` (JSON: skill, current_level, required_level, semantic_score), `prioritised_plan` (JSON array of ordered recommendations with learning resources), `created_at`.
- `LearningResource` — `title`, `url`, `skill` FK, `source` (CURATED / SEARCH_LINK), `description`.

### 4.6 pathway (M5)
- `PathwayRole` — `title`, `level` (ENTRY / MID / SENIOR / SPECIALIST), `industry`, `description`, `typical_skills` (M2M Skill), `salary_band` (optional), `esco_id`.
- `PathwayEdge` — `from_role` FK, `to_role` FK, `difficulty` (1–5), `typical_time_months`, `notes`.

### 4.7 adminpanel
- `AppLog` / `SystemSetting` — optional operational tables (aggregation schedule, model version flags).

---

## 5. Complete Page Inventory (React routes)

### 5.1 Public (no authentication)
| Route | Page | Purpose / key content |
|-------|------|----------------------|
| `/` | **Home / Landing** | Hero + problem statement, the 5 modules explained, "How it works" (3 steps: profile → matches → roadmap), CTA to Sign Up / Log In, footer. |
| `/signup` | **Sign Up** | Email, name, admission number, school, year, password; role = student by default. Validates Strathmore context. |
| `/login` | **Log In** | Email + password; JWT stored; redirect by role. |
| `/forgot-password` | **Forgot Password** | Request reset link. |
| `/reset-password/:token` | **Reset Password** | Set new password. |
| `/about` | **About / How It Works** | Project background, research motivation, module details, FAQ. |

### 5.2 Student (authenticated)
| Route | Page | Purpose / key content |
|-------|------|----------------------|
| `/dashboard` | **Dashboard** | Post-login hub: profile completeness bar, top 5 matches, top 3 skill gaps, pathway progress, recent/saved opportunities, CTA to complete onboarding. |
| `/onboarding` | **Onboarding Wizard (M1)** | 4 steps: (1) academic info; (2) skills self-assessment (checkbox/sliders, 1–5); (3) interests + readiness level; (4) review + submit → runs initial profiling. Progress indicator. Editable later. |
| `/profile` | **My Career Profile (M1)** | View/edit all profile fields, skills list, interests; shows "profile health" (completeness %), adaptive update history, readiness level. |
| `/opportunities` | **Opportunities Feed (M2 output)** | Searchable, filterable list (type, industry, source_type, experience level, deadline); pagination; save/bookmark button; source badges (formal/informal). |
| `/opportunities/:id` | **Opportunity Detail** | Full listing; match score if matched; "Skills you have vs. required"; apply/save buttons; source attribution; report button. |
| `/matches` | **My Matches (M3)** | Ranked personalised feed with match score and "Why matched" explanation; feedback thumbs up/down (feeds adaptive + CF). |
| `/skills-gap` | **Skills Gap Analysis (M4)** | Select target role (or pick from a matched opportunity); shows current vs. required skills, gap list, prioritised development plan, linked learning resources. |
| `/pathway` | **Career Pathway (M5)** | Interactive roadmap graph: current position node, target role nodes, edges with skills/time; click role to highlight route; compare 2–3 target roles side-by-side. |
| `/saved` | **Saved Opportunities** | Bookmarked opportunities; apply/filter/remove. |
| `/resources` | **Learning Resources** | Curated resource library by skill/category (from M4 outputs and admin). |
| `/settings` | **Account Settings** | Change password, notification prefs, data export/delete, logout-all. |

### 5.3 Admin (role-gated)
| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | **Admin Dashboard** | Stats: registered students, opportunities (approved/pending), aggregation runs, match counts, module usage. |
| `/admin/users` | **User Management** | List/search students; view profile; suspend/activate. |
| `/admin/opportunities` | **Opportunity Management** | Table of all listings; approve/reject/expire/edit/delete; view raw extracted data. |
| `/admin/opportunities/new` · `/admin/opportunities/:id/edit` | **Create/Edit Opportunity** | Manual entry + approve. |
| `/admin/sources` | **Source Management** | Manage OpportunitySource records; view last run, items found, errors; trigger aggregation run now. |
| `/admin/analytics` | **Analytics / Reports** | Module usage, match quality (feedback rates), top opportunities, gap-analysis coverage. |
| `/admin/skills` | **Skills Taxonomy** | Manage Skill records, aliases, ESCO imports, categories. |

### 5.4 System
| Route | Page |
|-------|------|
| `*` | 404 Not Found |
| `/500` | 500 Error page |

---

## 6. REST API Endpoints (DRF)

Base: `/api/`. Versioned `/api/v1/`. Swagger at `/api/docs/`.

### Auth (accounts)
- `POST /api/v1/auth/register/` — student signup
- `POST /api/v1/auth/login/` — returns access + refresh
- `POST /api/v1/auth/refresh/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/password-reset/` · `POST /api/v1/auth/password-reset/confirm/`

### Profile (M1)
- `GET/PUT /api/v1/profile/` — read/update StudentProfile
- `POST /api/v1/profile/onboarding/` — submit the 4-step wizard → triggers initial profiling
- `GET/PUT /api/v1/profile/skills/` — manage StudentSkill list
- `GET/PUT /api/v1/profile/interests/`
- `POST /api/v1/profile/interactions/` — log profile interaction (for adaptive updates)

### Opportunities (M2)
- `GET /api/v1/opportunities/` — feed with filters, search, pagination, sort
- `GET /api/v1/opportunities/:id/` — detail incl. required skills
- `POST /api/v1/opportunities/` (admin) · `PUT/DELETE` (admin)
- `POST /api/v1/opportunities/community/` — student/community submission → PENDING
- `GET /api/v1/opportunities/saved/` · `POST /api/v1/opportunities/:id/save/` · `DELETE .../save/`

### Sources & aggregation (M2)
- `GET/POST /api/v1/admin/sources/` · `GET/PUT/DELETE /api/v1/admin/sources/:id/`
- `POST /api/v1/admin/sources/:id/run/` — trigger aggregation run
- `GET /api/v1/admin/aggregation-runs/`

### Matching (M3)
- `GET /api/v1/matches/` — ranked personalised feed (cached MatchResult; recompute on demand)
- `GET /api/v1/matches/:opportunity_id/` — single match detail + explanation
- `POST /api/v1/matches/:opportunity_id/feedback/` — thumbs up/down / rating

### Skills gap (M4)
- `POST /api/v1/skills-gap/analyze/` — body: `{ target_role }` or `{ opportunity_id }` → returns SkillGapAnalysis
- `GET /api/v1/skills-gap/analyses/` — history list
- `GET /api/v1/resources/` — learning resources by skill

### Pathway (M5)
- `GET /api/v1/pathway/` — returns current position, role nodes, edges, and highlighted routes
- `GET /api/v1/pathway/roles/` · `GET /api/v1/pathway/roles/:id/`
- `POST /api/v1/pathway/compare/` — body: list of role ids → comparison payload

### Admin
- `GET /api/v1/admin/stats/`
- `GET /api/v1/admin/users/` · `PATCH /api/v1/admin/users/:id/`
- `GET/PUT/PATCH /api/v1/admin/opportunities/:id/` — review workflow
- `GET /api/v1/admin/analytics/`

### System
- `GET /api/v1/health/`

---

## 7. Sequential Development Plan (Phases)

Each phase = one or more Kanban milestones. **Kanban columns:** Backlog → In Progress → In Review → Done. Card template: title, module tag, description, acceptance criteria, dependencies, estimated effort. Keep WIP ≤ 3.

### PHASE 0 — Project Foundation (Weeks 1–2)
**Goal:** Empty repo → runnable skeleton with auth, DB, and frontend shell.

Tasks:
1. Create GitHub repo (private), GitHub Project board with the 4 Kanban columns; add all phase cards to Backlog.
2. Backend: `django-admin startproject core`; create apps: `accounts`, `profiles`, `opportunities`, `matching`, `gapanalysis`, `pathway`, `adminpanel`.
3. Install dependencies (`requirements.txt`): django, djangorestframework, djangorestframework-simplejwt, django-cors-headers, drf-spectacular, psycopg[binary], python-dotenv, requests, beautifulsoup4, lxml, pandas, numpy, scikit-learn, spacy, sentence-transformers, transformers, rapidfuzz, surprise, ollama (python client).
4. `.env` (SECRET_KEY, DB creds, DEBUG) + `.env.example`; gitignore.
5. PostgreSQL database `career_guide_dev`; Django settings wired to env.
6. Custom `User` model with `role` (set before first migration!). JWT auth configured; registration/login endpoints; email + password validation; CORS for Vite dev server.
7. Frontend: `npm create vite@latest frontend -- --template react`; React Router; Axios client with JWT interceptor and 401-refresh logic; Tailwind setup; layout components (Navbar, Footer, ProtectedRoute, AdminRoute).
8. Landing page placeholder; Sign Up / Log In wired to API.
9. drf-spectacular Swagger at `/api/docs/`; Postman collection scaffold.

**Acceptance criteria:** `python manage.py migrate` runs clean; user can register, log in, and hit an authenticated endpoint; React app talks to API through Vite proxy; landing/login/signup render.

**Kanban cards:** Repo & board setup · Backend skeleton · Auth API · Frontend shell · CI-less lint & type checks (ruff/black for Python, eslint for JS).

### PHASE 1 — Database Schema & Core Models (Week 2–3)
**Goal:** All models from Section 4 implemented + migrated + admin registered.

Tasks:
1. Implement all Django models (Section 4) with relationships, constraints, indexes.
2. Create and run migrations; seed: 7 schools, starter `Skill` taxonomy (from ESCO extract + common Kenyan graduate skills), initial `PathwayRole`/`PathwayEdge` seed (~30–50 roles across the 7 schools' industries), 3 starter `OpportunitySource` records (formal, informal, institutional).
3. Register everything in Django admin.
4. Factories/test fixtures for all models.

**Acceptance criteria:** ER diagram (Chapter 4 deliverable) matches implemented schema; every module has models; seeding script idempotent.

### PHASE 2 — Design Diagrams Draft (Week 2–3, in parallel)
**Goal:** Produce the OOAD diagrams the proposal promises (Chapter 4 of final report): use case, class, sequence (profile creation, matching, gap analysis), activity (end-to-end student journey), ER. Keep them in sync with the implemented code. Tools: draw.io / diagrams.net, exported PNG + editable source into `docs/diagrams/`.

### PHASE 3 — M1: Adaptive Career Profiling Module (Weeks 3–5)
**Goal:** Students can complete onboarding and get a profile that improves with use.

Backend:
1. Onboarding serializer + endpoint: validate and store academic info, skills, interests, readiness level; compute `profile_completeness`.
2. **Skill vectorisation:** embed each skill + the profile's skill set with `sentence-transformers/all-MiniLM-L6-v2` (384-dim, CPU-fast). Cache embeddings (DB JSONB or pickle cache) — never recompute on every request.
3. **Readiness rubric (rule-based):** map (year_of_study, #skills, avg level, has_interests, has_career_goal, interaction count) → EXPLORING/PREPARING/APPLYING/READY.
4. **Career-cluster classifier (light ML):** TF-IDF over profile text (bio, interests, skills joined) → `SGDClassifier`/`LogisticRegression` predicting broad career cluster (data/tech, business/finance, law, hospitality, humanities, etc.). Train on a Kaggle career-aspiration dataset (Section 8). Store `model_version`.
5. **Adaptive update logic:** on each `ProfileInteraction` (view/save/apply/rate), update interest weights (exponential-decay recency weighting) and trigger a re-embedding of the profile vector; batch-retrain the cluster classifier when new labelled interaction data crosses a threshold (e.g., +50 labelled rows) or weekly.
6. Expose `GET/PUT /profile/`, onboarding endpoint, interactions endpoint.

Frontend:
7. Onboarding wizard (4 steps, progress bar, validation, review screen) calling the API.
8. Profile page (view/edit skills with level sliders, interests, readiness display, completeness ring).
9. Dashboard section showing profile completeness + readiness level.

**ML notes:** MiniLM is ~80MB, runs on CPU in milliseconds. scikit-learn models are pickled to `models/` with versioned filenames; load lazily in services.

**Acceptance criteria:** Onboarding completes in ≤5 minutes; profile persists; profile_completeness reflects filled fields; interactions change profile vector (visible as changed recommendations in M3 later); readiness level matches rubric.

**Kanban cards:** Onboarding API · Skill embeddings service · Readiness rubric · Cluster classifier training · Adaptive update service · Onboarding UI · Profile UI.

### PHASE 4 — M2: Opportunity Aggregation Module (Weeks 5–7)
**Goal:** A populated opportunity DB from formal + informal sources, with an NLP extraction pipeline and admin review.

Data collection:
1. **Formal:** BrighterMonday / Fuzu public listing pages — rate-limited scraper (respect robots.txt, delay 2–5s, small volumes) or RSS/manual CSV snapshot; store raw HTML/text.
2. **Institutional:** Strathmore career-portal / SCS newsletter posts — admin manual paste or CSV import.
3. **Informal:** exported WhatsApp channel `.txt` files (with permission), shared Google Docs, plus a **community submission form** (students/lecturers post micro-opportunities) → status PENDING.
4. A management command `python manage.py run_aggregation --source <id>` orchestrating one source; another `--all`.

NLP pipeline (per raw listing text, in this order):
1. **Cleaning:** strip HTML, normalise whitespace/encoding, remove noise lines (ads, forwards).
2. **Structured extraction (LLM):** call local Ollama (`llama3.2:3b`) with a strict JSON-schema prompt:
   ```text
   Extract from this job/opportunity post: {"title": ..., "organisation": ..., "type": ..., "industry": ..., "location": ..., "deadline": ..., "experience_level": ..., "skills": [...], "description": ...}
   ```
   Validate output against the schema; on failure → fallback heuristic parser (regex for email/deadline/location; title = first meaningful line; org = known-list match).
3. **Classification (fallback when LLM down):** zero-shot Hugging Face pipeline `facebook/bart-large-mnli` with candidate labels for `type` and `industry`.
4. **Skill extraction:** spaCy `PhraseMatcher` against the Skill taxonomy (with alias expansion) + `rapidfuzz` fuzzy match; LLM skills list merged in.
5. **Deduplication:** embedding (MiniLM) cosine similarity ≥ 0.90 → treat as duplicate; also URL hash. Merge/update instead of inserting.
6. **Store:** `Opportunity` record (status PENDING) + `AggregationRun` log + raw_text retained.

Admin review UI (Phase 4 includes it): approve/reject/edit extracted fields; admin can re-run extraction per item.

**ML notes:** Ollama is free/offline — set `OLLAMA_HOST` in `.env`. If Ollama is unavailable, the pipeline must still function via heuristics + zero-shot classification (degraded mode).

**Acceptance criteria:** ≥100 structured opportunities from ≥3 sources; extraction of title/org/deadline/skills works on 20 test posts (manual spot-check); duplicates merged; pending→approved workflow works; aggregation run logs errors; frontend feed (`/opportunities`) lists approved items with filters.

**Kanban cards:** Formal scraper · Informal/community ingestion · Cleaning + fallback parser · Ollama JSON extraction · Zero-shot classification · Skill extraction · Dedupe · Admin review UI · Feed UI.

### PHASE 5 — M3: Personalised Matching Engine (Weeks 7–9)
**Goal:** Ranked personalised opportunity feed with explanations + feedback loop.

Backend:
1. **Content-based scoring:**
   - Profile vector = mean of skill embeddings + interest embeddings (+ weighted by level).
   - Opportunity vector = mean of its skill/description embeddings.
   - `content_score = 0.6·cosine(profile_vec, opp_vec) + 0.2·skill_jaccard + 0.2·text_sim(profile_bio, description)`.
   - Soft rule filters (penalise, don't exclude): year_of_study vs experience_level; school/industry relevance.
2. **Collaborative filtering:**
   - Build user–item matrix from `UserInteraction` (view=1, click=2, save=3, apply=5, dislike=−2).
   - `surprise.SVD` (or Alternating Least Squares) → predicted rating per (user, item).
   - **Cold start:** new users / items with no interactions → `collab_score = 0` and weight shifts to content + popularity.
3. **Hybrid:** `final = w1·content + w2·collab + w3·recency_norm + w4·popularity_norm`, default `(0.5, 0.3, 0.1, 0.1)`; weights configurable via `SystemSetting`; rebalance after feedback.
4. **Explanation:** store per-match reason strings: "Matches your interest in Data Science", "Students like you applied here", "You have 4 of 6 required skills".
5. **Caching:** `MatchResult` rows with 24h TTL; recompute for a user when profile changes or on-demand.
6. **Evaluation script** (`scripts/evaluate_matching.py`): holdout split on interactions → precision@10, recall@10, NDCG@10; log scores per `model_version`.
7. `GET /matches/`, `GET /matches/:id/`, feedback endpoint.

Frontend:
8. Matches page: ranked cards with score ring, reason chips, thumbs up/down.
9. Opportunity detail: "Match: 82%" + skills you have / need.

**Acceptance criteria:** ranked feed returns within 3s (cached); cold-start user gets sensible content-based results; feedback changes subsequent ranking; evaluation script prints metrics; "why matched" shown on every card.

**Kanban cards:** Content scorer · SVD CF trainer · Hybrid ranker + weights · Match caching · Explanation service · Eval script · Matches UI · Feedback wiring.

### PHASE 6 — M4: Skills Gap Analysis Tool (Weeks 9–10)
**Goal:** Student picks a target role/opportunity → prioritised development plan with resources.

Backend:
1. **Required-skills source:** target `PathwayRole.typical_skills` + skills tagged on the opportunity + LLM-extracted skills from the description (Ollama, fallback to taxonomy matching).
2. **Semantic comparison:** for each required skill, embed it (MiniLM) and cosine-compare against each student skill; map synonyms (e.g., "data analysis" ≈ "analytical thinking" when sim ≥ 0.55 — threshold tuned on a small dev set of 20 pairs). Gap = required skill with no student skill above threshold or level below required.
3. **Prioritisation:** score each gap = frequency across target roles (weight 0.4) + entry-criticality (0.3, from ESCO/curated data) + student's stated interest in domain (0.2) + effort estimate (0.1). Sort descending → `prioritised_plan`.
4. **Learning resources:** curated `LearningResource` rows per skill + fallback search links (Google/Coursera/YouTube search URLs) generated at runtime.
5. **LLM narrative (optional but nice):** Ollama summarises the plan in 3–4 sentences ("Focus on X first because…"). Store in analysis.
6. `POST /skills-gap/analyze/`, `GET /skills-gap/analyses/`.

Frontend:
7. Skills-gap page: target-role picker (searchable dropdown + "use this opportunity" button), results table (skill, have, need, priority), plan card list with resource links, "regenerate" button.

**Acceptance criteria:** 20 hand-labelled gap test cases (Section 8) pass ≥80%; synonym pairs correctly matched; plan is ordered sensibly; resources open/valid; analysis persists and reloads.

**Kanban cards:** Required-skills service · Semantic gap detector (+ threshold tuning) · Prioritisation engine · Resource service · LLM narrative · Analyze API · Skills-gap UI.

### PHASE 7 — M5: Career Pathway Visualisation (Weeks 10–11)
**Goal:** Interactive roadmap combining profile, matches and gaps.

Backend:
1. Pathway graph service: nodes = `PathwayRole`, edges = `PathwayEdge`; current position node derived from profile (readiness + cluster → closest entry roles).
2. Route computation: BFS/Dijkstra (edge weight = difficulty) from current position to each target role; return node list + edge metadata (skills, time).
3. `GET /pathway/`, `POST /pathway/compare/` (compare 2–3 targets: roles, skills, time-to-target, gap overlap).

Frontend:
4. Pathway page with `@xyflow/react`: custom nodes (current position, entry, target), edge labels (months, difficulty), click-to-highlight route, sidebar showing role details + skills along path.
5. Compare view: side-by-side cards (time, # gaps, salary band, match score) — data pulled from M3/M4 APIs.
6. Responsive: works on mobile browsers (zoom/pan or simplified list fallback).

**Acceptance criteria:** graph renders; selecting a target highlights a route; compare shows meaningful differences; pathway data consistent with match + gap outputs (integration tested).

**Kanban cards:** Pathway graph service · Route finder · Compare API · React Flow page · Mobile fallback.

### PHASE 8 — Integration, Polish & System Testing (Weeks 11–12)
Tasks:
1. End-to-end data flow audit: onboarding → matches → gap → pathway consistent for one test user.
2. Edge cases: empty states, expired opportunities, incomplete profiles, LLM offline fallback, slow model load (preload/cache), pagination, JWT expiry refresh.
3. Notifications (optional): saved-opportunity deadline reminders (simple email or in-app).
4. Admin analytics page finalisation.
5. Performance pass: index hot queries, cache embeddings, ensure <3s page loads.
6. **Playwright E2E suite:** signup → onboarding → dashboard; browse/save opportunity; run gap analysis; render pathway; admin approve workflow. Run headless in CI-like script.
7. **Integration tests (DRF APIClient):** profile→match, aggregation→match, gap→pathway flows.
8. **Unit tests (pytest):** each module's services; ML eval script in CI (`scripts/`).

**Acceptance criteria:** all E2E specs green; integration flows verified; no console errors; Lighthouse/Playwright no fatal errors.

**Kanban cards:** Data-flow audit · Edge-case fixes · Performance pass · E2E suite · Integration tests · Notifications.

### PHASE 9 — Usability Testing & Refinement (Weeks 12–13)
Per proposal §3.6: functional evaluation + usability testing.
1. Recruit 5–10 Strathmore undergraduates across ≥3 schools.
2. Scripted tasks: sign up, complete onboarding, find a relevant opportunity, save it, run a skills-gap analysis, explore the pathway, give feedback on 2 matches.
3. Measure: task completion rate, time-on-task, errors; SUS questionnaire (≥68 = acceptable target).
4. Debrief: collect qualitative notes; log issues in GitHub Issues/Kanban; fix high-severity issues; rerun affected E2E tests.
5. Compile usability report (into final report Chapter 5).

**Acceptance criteria:** ≥80% task completion; SUS ≥ 68; all high-severity issues fixed and re-tested.

### PHASE 10 — Deployment, Documentation & Final Deliverables (Weeks 13–15)
1. **Deployment:** staging/demo environment — backend on Render/Railway (or local server demo) with Gunicorn + whitenoise; PostgreSQL on Supabase free tier (or local); frontend static build on Vercel/Netlify; `.env` production values; `DEBUG=False`; CORS restricted; backup/export of DB (dump command documented).
2. **README.md:** setup, env vars, run commands, architecture summary, module map.
3. **API docs:** Postman collection export + Swagger live at `/api/docs/`.
4. **Diagrams finalised** in `docs/diagrams/` (sync with final code).
5. **Test reports:** unit/integration/system (Playwright) + usability (SUS scores, notes) saved in `docs/testing/`.
6. **Final report Chapter 4 (design) & Chapter 5 (implementation/testing)** drafted from this plan's records; demo script + video; defence presentation.
7. Data export: sample datasets used/collected documented with sources (Kaggle, ESCO, listing snapshots).

**Acceptance criteria:** clean deploy from README instructions on a fresh machine; all docs present; demo works end-to-end offline-or-staging; final report chapters complete.

---

## 8. AI / ML Model Recommendations (per module)

### 8.1 Embedding model (shared by M1, M2, M4)
- **`sentence-transformers/all-MiniLM-L6-v2`** — 384-dim, ~80MB, CPU inference in milliseconds. Use for: skill vectors, opportunity description vectors, dedupe, semantic gap detection. Cache all embeddings.
- Why not larger models (BGE, E5, BERT-large): CPU-only constraint and latency; MiniLM is the industry default for this trade-off.

### 8.2 M1 Adaptive Profiling
- **Skill/profile vectorisation:** MiniLM embeddings (above).
- **Career-cluster classifier:** `scikit-learn` `Pipeline(TfidfVectorizer → SGDClassifier)` (or LogisticRegression). Train on Kaggle datasets: *"Students' Career Aspirations"* / *"Career Recommendation System"* datasets. Labels: 6–8 clusters (Data & Tech, Business & Finance, Law & Policy, Hospitality & Tourism, Health, Media & Communications, Education, Generalist).
- **Readiness level:** deterministic rubric (no ML) — transparent and easy to defend in the report.
- **Adaptive updates:** recency-weighted interest scores + periodic batch retraining (no online-gradient gymnastics needed at this scale). Version models in `models/` with git-tracked metadata.

### 8.3 M2 Opportunity Extraction
- **Primary structured extraction:** local LLM via **Ollama** (`llama3.2:3b`) with a strict JSON-schema prompt. Small model = fast on CPU (~seconds per listing, batch async).
- **Fallback (LLM down):** heuristic parser + **zero-shot classification** with Hugging Face `facebook/bart-large-mnli` for `type` and `industry`.
- **NER (optional):** `spacy` `en_core_web_lg` for org/date entities as a cross-check.
- **Skill extraction:** spaCy `PhraseMatcher` on the Skill taxonomy + `rapidfuzz` fuzzy matching; merge with LLM-extracted skills.
- **Deduplication:** MiniLM cosine ≥ 0.90 + URL hash.

### 8.4 M3 Matching
- **Content-based:** TF-IDF + cosine (cheap) blended with MiniLM semantic cosine; skill-Jaccard overlap.
- **Collaborative filtering:** `surprise.SVD` (matrix factorisation) on user–item interactions. Handle cold start with content+popularity fallback. Retrain when interaction volume grows by ≥25% or weekly.
- **Hybrid ranker:** weighted linear blend (Section 7, Phase 5) — simple, explainable, tunable via admin settings. Optional upgrade: LightGBM learning-to-rank if labelled feedback data becomes sufficient (probably not needed by November).
- **Evaluation:** offline holdout → precision@10, recall@10, NDCG@10; track per model version.

### 8.5 M4 Skills Gap
- **Semantic similarity:** MiniLM cosine between required-skill phrase and student-skill phrase; threshold ~0.55 (tune on 20 labelled pairs). This is what makes "data analysis" ≈ "analytical thinking" work — the proposal's core claim.
- **Skill taxonomy:** **ESCO** (free CSV from esco.ec.europa.eu) — occupation skill profiles + hierarchy. Import subset relevant to the 7 schools.
- **Prioritisation:** deterministic weighted formula (Section 7, Phase 6), not ML — explainable for the report.
- **Plan narrative:** optional Ollama summary.

### 8.6 M5 Pathway
- No ML needed — graph data structure (ESCO + curated Strathmore-relevant roles) + BFS/Dijkstra route finding. Note in the report that pathway guidance is data-driven; ML (predictive next-role) is flagged as future work.

### 8.7 Cost & compute guardrails
- All models run locally / CPU; total disk ~1–2GB (Ollama model ~2GB, MiniLM ~80MB, spaCy ~600MB, bart-large-mnli ~1.6GB — install on demand, lazy-load).
- If the laptop struggles, swap bart-large-mnli for `typeform/distilbert-base-uncased-mnli` (smaller) and use Ollama `qwen2.5:1.5b` as the tiny fallback.
- Never block the request path on model inference: run extraction/gap analysis as background tasks (management commands / simple threading), store results, serve cached outputs.

---

## 9. Data Strategy

| Purpose | Source | Notes |
|---------|--------|-------|
| ML training (clusters) | Kaggle: career aspiration / job-recommendation datasets | Download, document in report |
| Skills taxonomy | ESCO (esco.ec.europa.eu free CSV) | Import subset, map to Skill model |
| Formal opportunities | BrighterMonday, Fuzu public pages | Rate-limited scraping or CSV snapshots; respect robots.txt |
| Institutional | Strathmore career portal / SCS newsletters | Admin manual entry / import |
| Informal opportunities | Exported WhatsApp channel text files (with permission), shared docs | NLP pipeline target; store raw text |
| Community-sourced | Built-in submission form | Students/lecturers post micro-opportunities → PENDING review |
| CF test data | Synthetic seeded interactions + early user testing | Document as synthetic in report |
| Evaluation | 20 hand-labelled gap cases; 20 extraction spot-check posts; holdout interactions | Build as test fixtures in repo |

**Ethics/privacy (report-relevant):** only public/consented data; no scraping of closed WhatsApp groups without permission; personal data minimised; users can export/delete their data (settings page).

---

## 10. Testing Strategy (summary of per-phase criteria)

| Level | Tool | Scope |
|-------|------|-------|
| Unit | pytest | Module services, ML functions, validators |
| Integration | DRF APIClient | Profile→Match, Aggregation→Match, Gap→Pathway flows |
| System/E2E | Playwright | Full user journeys incl. admin workflow |
| ML evaluation | scripts/evaluate_matching.py, gap dev set | Precision/Recall/NDCG, gap accuracy |
| Usability | Task sessions + SUS | 5–10 students, ≥80% completion, SUS ≥68 |
| Performance | Manual + Playwright traces | Pages <3s, gap analysis <5s |

---

## 11. Timeline to End of November 2026 (~15 weeks)

| Weeks | Dates | Phase | Deliverable |
|-------|-------|-------|-------------|
| 1–2 | Aug 17 – Aug 30 | Phase 0 | Repo, auth, frontend shell working |
| 2–3 | Aug 24 – Sep 6 | Phase 1 + 2 | DB schema + design diagrams |
| 3–5 | Aug 31 – Sep 20 | Phase 3 | M1 Adaptive Profiling (unit-tested) |
| 5–7 | Sep 21 – Oct 11 | Phase 4 | M2 Aggregation + 100 opportunities |
| 7–9 | Oct 12 – Nov 1 | Phase 5 | M3 Matching engine + eval |
| 9–10 | Nov 2 – Nov 8 | Phase 6 | M4 Skills Gap Analysis |
| 10–11 | Nov 9 – Nov 15 | Phase 7 | M5 Pathway visualisation |
| 11–12 | Nov 16 – Nov 22 | Phase 8 | Integration, polish, E2E tests |
| 12–13 | Nov 23 – Nov 30 | Phase 9 | Usability testing + fixes |
| 13–15 | Nov 23 – Dec 6 | Phase 10 | Deploy, docs, report, demo (buffer into early Dec) |

Each module is developed to its acceptance criteria and unit-tested before the next begins (per proposal §3.2.3).

---

## 12. How to Use This Plan With Your Prompt Engine

1. **Kickoff prompt:** paste Sections 1–6 + the current phase's Section 7 block; ask the agent to (a) scaffold the repo per Section 2, (b) implement the phase tasks, (c) run the acceptance criteria, (d) commit with a clear message.
2. **Per-phase prompts:** paste only the relevant phase + data model + pages/endpoints sections. Example: *"Implement Phase 4 (M2 Opportunity Aggregation) per DEVELOPMENT_PLAN.md — build the NLP pipeline, the run_aggregation command, and the admin review UI, then run its acceptance criteria."*
3. **Kanban discipline:** before each phase, create its cards in GitHub Projects Backlog; move through In Progress → In Review → Done; attach test results to In Review cards.
4. **Keep the plan updated:** if the supervisor changes scope, edit this file first, then prompt the agent with the diff — the plan is the contract.
5. **Design-diagram sync:** regenerate diagrams as the schema/code evolves so Chapter 4 matches the final system.

---

## 13. Deliverables Checklist (final handover)

- [ ] Working web app: 5 modules, all pages in Section 5, all endpoints in Section 6
- [ ] PostgreSQL schema matching ER diagram
- [ ] Design diagrams (use case, class, 3× sequence, activity, ER)
- [ ] ≥100 aggregated opportunities from ≥3 source types
- [ ] Trained/versioned models (cluster classifier, SVD, embeddings cache) + eval metrics
- [ ] Test reports: unit, integration, Playwright E2E, usability (SUS)
- [ ] API docs (Swagger + Postman collection)
- [ ] README + setup guide (fresh-machine reproducible)
- [ ] Deployment running (staging/demo URL) with backup/export documented
- [ ] Final report Chapters 4–5, demo video, defence presentation
- [ ] Git history clean; GitHub Projects board complete
