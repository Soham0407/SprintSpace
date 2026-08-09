# SprintSpace

**The AI-powered operating system for student hackathons and competitions.**

One workspace for planning sprints, matching teammates, shipping projects,
and building a public proof-of-work archive — instead of six apps
stitched together with WhatsApp threads, Trello boards, and a Drive folder nobody can find.

> Team → Workspace → Ship → Portfolio.

---

## Table of contents

1. [What's inside](#1-whats-inside)
2. [Tech stack](#2-tech-stack)
3. [Repo layout](#3-repo-layout)
4. [Quick start — frontend](#4-quick-start--frontend)
5. [Running the AI service](#5-running-the-ai-service)
6. [Environment variables](#6-environment-variables)
7. [Pages & routes](#7-pages--routes)
8. [The data layer](#8-the-data-layer)
9. [Backend & database (Supabase)](#9-backend--database-supabase)
10. [AI service](#10-ai-service)
11. [Design system](#11-design-system)
12. [Deploying to Vercel](#12-deploying-to-vercel)
13. [Project status](#13-project-status)

---

## 1. What's inside

| Feature | Where | What it does |
|---|---|---|
| **Landing / marketing page** | `/` | Hero with a cursor spotlight that reveals a clean dashboard "underneath" scattered tools, a live WebGL globe of active builders, the AI Context Engine pitch, and feature cards. |
| **Dashboard** | `/dashboard` | Personalized greeting, "Start New Competition" CTA, your active workspaces with live progress + days left, archive navigation, and a settings drawer. |
| **Create Competition** | `/newcompetition` | Multi-step setup: competition type (Hackathon / College / Startup / Personal), dates, max team size, solo mode, description, and team invitation flow. |
| **TeamMatch** | `/teammatch` | Browse AI-ranked teammate candidates (match score, skills, availability) and invite them before creating the workspace. |
| **Workspace** | `/workspace/:workspaceId` | The command center: project health score, progress %, critical blockers, a black-hole countdown to the deadline, Smart Kanban, team dashboard, timeline & milestones, an Ask-AI widget, and Finish/Delete actions. |
| **SprintRoom** | `/sprintroom` | Team chat + online members + pinned updates (currently mock UI). |
| **Resource Hub** | `/resources` | Rulebook + project files upload/linking, GitHub repo card, and a searchable/tag-filterable resource explorer. |
| **Archive** | `/archive` | Shipped projects rendered as a star constellation (brighter star = bigger win), connected by shared tech stack. |
| **Auth** | `/login`, `/signup` | Real Supabase email/password auth with Zod-validated React Hook Form, password reset, and email confirmation flow. |
| **AI Planner** | separate service | FastAPI + Google Gemini backend that generates a sprint plan (milestones, tasks, assignments, timeline) from a project brief. |

---

## 2. Tech stack

### Frontend (`/`)

| Layer | What |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router 7 (client-side, lazy-loaded per route) |
| Animation | Framer Motion, plus hand-built canvas/WebGL (globe, black holes, constellation) |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei`, `react-globe.gl`, `ogl`, `simplex-noise` |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |
| Fonts | Inter (body), Orbitron (display), Space Mono (mono) — self-hosted via `@fontsource/*` |
| Backend client | `@supabase/supabase-js` |
| ReactBits | Third-party animation primitives (`Threads`, `StarBorder`, `ClickSpark`, `CountUp`, `DecryptedText`, `SpotlightCard`, `LiquidChrome`) |

### Backend & database

| Layer | What |
|---|---|
| Platform | Supabase (hosted Postgres + Auth + Storage + RPCs) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (avatars, resource files) |
| Server functions | PostgreSQL RPCs (`get_workspace`, `accept_invite`) |

### AI service (`/ai-service`)

| Layer | What |
|---|---|
| Framework | FastAPI + Uvicorn |
| LLM | Google Gemini (`google-genai` SDK) |
| Config | `pydantic-settings` |
| Endpoints | `POST /ai/planner`, `GET /health/gemini`, `GET /` |

---

## 3. Repo layout

```
.
├─ src/                        # React frontend
│  ├─ api/                     # Data layer — one file per entity (see §8)
│  │  ├─ types.ts              # Shared data contracts (the API spec)
│  │  ├─ mockClient.ts         # Simulated-delay helper used for mock fallbacks
│  │  ├─ candidates.ts         # TeamMatch candidates
│  │  ├─ workspace.ts          # Workspace data + delete (uses get_workspace RPC)
│  │  ├─ createCompetition.ts  # Creates competition + workspace + membership + kanban + timeline
│  │  ├─ invites.ts            # Send / accept / decline invites
│  │  ├─ resources.ts          # Resource CRUD + file upload to Storage
│  │  ├─ archive.ts            # Archive CRUD (soft-delete + restore)
│  │  └─ profile.ts            # Profile CRUD + avatar upload
│  ├─ pages/                   # One file per route
│  ├─ sections/                # Landing sections (Hero, Globe, About, Features)
│  ├─ components/
│  │  ├─ layout/               # Navbar, Footer, PageShell, AuthLayout, SkeletonCard
│  │  ├─ hero/                 # Hero mockups, RevealMask, CursorGlow, HeroSpaceLayer
│  │  ├─ deadline/             # BlackHoleCountdown
│  │  ├─ archive/              # ConstellationField
│  │  ├─ dashboard/            # SettingsDrawer (profile, invites, notifications)
│  │  ├─ workspace/            # AskAIWidget (AI chat shell — not wired yet)
│  │  ├─ animations/           # Reusable text/scroll animations
│  │  └─ reactbits/            # ReactBits animation primitives
│  ├─ hooks/                   # useAsyncData
│  ├─ lib/                     # supabaseClient, authApi, authSchemas
│  ├─ context/                 # AuthContext (session state)
│  ├─ data/                    # countries.json + useCountryUsers (globe data)
│  └─ App.tsx                  # All routes defined here
│
├─ ai-service/                 # Python AI backend
│  └─ app/
│     ├─ main.py               # FastAPI app + root + /health/gemini
│     ├─ core/config.py        # Settings (GEMINI_API_KEY, GEMINI_MODEL)
│     ├─ routes/planner.py     # POST /ai/planner
│     ├─ schemas/planner.py    # Pydantic request models
│     ├─ prompts/planner_prompt.py  # Gemini prompt builder
│     └─ services/
│        ├─ gemini_client.py   # Shared Gemini client
│        ├─ gemini_service.py  # ask_gemini() helper
│        ├─ planner_engine.py  # Calls Gemini, parses JSON plan
│        └─ health_engine.py   # (stub — future health scoring)
│
├─ index.html                  # HTML entry
├─ package.json                # npm scripts + deps
├─ vite.config.ts              # Vite config (React plugin)
├─ tailwind.config.js          # Theme tokens (ink/card/surface/accent/fonts)
├─ vercel.json                 # SPA rewrites for Vercel
├─ .env                        # Local env vars (gitignored) — see §6
└─ public/                     # favicon + icons
```

---

## 4. Quick start — frontend

```bash
npm install
cp .env.example .env   # then fill in your keys — see §6 (optional if you just want mock data)
npm run dev
```

Open the printed `localhost:5173` URL. **Without any env keys the entire app still runs**
on mock data (see §8), so you can start immediately.

Build for production:

```bash
npm run build     # tsc -b && vite build → outputs to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

---

## 5. Running the AI service

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

# Create ai-service/.env with your Gemini key (see §6)
cp .env.example .env

uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs are at
`http://127.0.0.1:8000/docs`.

Sanity checks:

```bash
curl http://127.0.0.1:8000/health/gemini        # Gemini reachability probe
curl -X POST http://127.0.0.1:8000/ai/planner \
  -H "Content-Type: application/json" \
  -d '{
    "competition": "Web Wonders 2026",
    "project_idea": "A chrome extension that turns your to-do list into an arcade game.",
    "deadline": "2026-09-01",
    "team": [
      { "name": "Aira",  "skills": ["React", "Tailwind"] },
      { "name": "Sid",   "skills": ["Python", "FastAPI"] }
    ]
  }'
```

---

## 6. Environment variables

Both apps read `.env` files. The values are **never committed** (`.env` is gitignored).

### Frontend — root `.env`

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | No* | Supabase project URL. Absent/placeholder → the app runs entirely on mock data. |
| `VITE_SUPABASE_ANON_KEY` | No* | Supabase anonymous publishable key. |

\* Set both Supabase vars together, or neither. Partial config = broken data layer.

### AI service — `ai-service/.env`

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key. |
| `GEMINI_MODEL` | No | `gemini-3.5-flash-lite` | Which Gemini model the planner uses. |

> Note: `ai-service/requirements.txt` is saved in **UTF-16 LE** encoding — `pip install`
> handles it fine, but if your editor shows mojibake that's why.

---

## 7. Pages & routes

| Path | Page | Lazy-loaded | Notes |
|---|---|---|---|
| `/` | Landing | no | Hero, globe, AI Context Engine, features |
| `/dashboard` | Dashboard | yes | Your workspaces, settings drawer |
| `/newcompetition` | New Competition | no | Multi-step setup + team invites |
| `/teammatch` | TeamMatch | yes | Invite AI-ranked candidates |
| `/workspace/:workspaceId` | Workspace | yes | Health, kanban, timeline, countdown, Ask AI |
| `/sprintroom` | SprintRoom | yes | Team chat (mock UI) |
| `/resources` | Resource Hub | yes | Rulebooks, files, explorer |
| `/archive` | Archive | yes | Shipped-project constellation |
| `/login`, `/signup` | Auth | yes | Supabase auth, Zod-validated |

All routes past `/` use `React.lazy` + code splitting, so visiting one page doesn't
download another page's heavy 3D/animation code.

---

## 8. The data layer

Every page gets its data through an async function in `src/api/`, **never** a hardcoded
array in a component. Each function is written in two modes:

1. **Supabase configured** → performs a real `supabase.from(...)` query (or an RPC) and
   returns data shaped exactly like the `src/api/types.ts` contracts.
2. **Not configured** → returns the same shape from a module-level mock array through
   `mockDelay()` (a simulated 400ms network delay), so loading skeletons and empty states
   are real and testable without a backend.

This is why `src/api/types.ts` is the de-facto API spec — the frontend never cares which
mode is active, so swapping mock → real is a one-file change per entity.

| Page | Route | Calls | Defined in |
|---|---|---|---|
| Dashboard | `/dashboard` | `workspaces` query | `DashboardPage.tsx` |
| TeamMatch | `/teammatch` | `getCandidates()` | `src/api/candidates.ts` |
| Resource Hub | `/resources` | `getResources()`, `createResource()`, `uploadResourceFile()`, `deleteResource()` | `src/api/resources.ts` |
| Archive | `/archive` | `getArchiveProjects()` | `src/api/archive.ts` |
| Workspace | `/workspace/:id` | `getWorkspace(id)`, `deleteWorkspace()` | `src/api/workspace.ts` |
| Settings drawer | — | `getProfile()`, `updateProfile()`, `uploadAvatar()`, `getMyInvites()`, `acceptInvite()`, `declineInvite()` | `src/api/profile.ts`, `src/api/invites.ts` |

All pages consume their API functions through `useAsyncData()` (`src/hooks/useAsyncData.ts`),
a generic hook returning `{ data, loading, error }`, so loading/error UI is uniform and
already wired up.

**Mock data that still exists on purpose:**

- **Globe user counts** (`src/data/useCountryUsers.ts`) — intentionally mock. Deterministic
  per-country numbers derived from country names (stable across reloads) so the landing
  globe looks alive for demos; they don't represent real signups.
- **SprintRoom** chat/online members — static mock arrays in the page.
- **Dashboard** falls back to `MOCK_COMPETITIONS` when the user has no workspaces.
- **Ask AI widget** (`AskAIWidget.tsx`) — renders a chat panel with the placeholder
  *"AI chat will live here. Not wired up yet."* — the natural home for the AI service.

---

## 9. Backend & database (Supabase)

The database lives in Supabase (PostgreSQL). Core tables the frontend talks to:

| Table | Purpose |
|---|---|
| `profiles` | One row per user (created by a DB trigger from auth metadata) — name, username, bio, role, avatar, notifications. |
| `candidates` | TeamMatch profiles — `role_wanted`, `skills`, `available`, `match_score`, FK to `profiles`. |
| `competitions` | Created competitions — slug, name, organizer, category, deadline, prize pool, team size, active flag. |
| `workspaces` | One per competition — `competition_id`, health score, progress, blockers, deadline, owner. |
| `workspace_members` | Who's in a workspace and their role + progress. |
| `kanban_columns` / `kanban_tasks` | Smart Kanban board. |
| `timeline_steps` | Milestone timeline (`done` / `active` / `pending`). |
| `invites` | Pending team invitations (`pending` / `accepted` / `declined`). |
| `resources` | Resource Hub items + file URLs (files in the `resources` Storage bucket). |
| `archive_projects` | Shipped-project archive (soft-delete via `deleted_at`). |

### Postgres RPCs

- **`get_workspace(workspace_id)`** — joins workspaces + kanban + team + timeline and
  returns the exact `WorkspaceData` JSON shape the frontend renders. Called by
  `src/api/workspace.ts`.
- **`accept_invite(invite_id)`** — atomically marks an invite accepted, inserts the user
  into `workspace_members`, and flips `candidates.available = false`. Called by
  `src/api/invites.ts`.

### Auth

- `src/lib/authApi.ts` wraps Supabase Auth: sign up, sign in, sign out, session, and
  password reset.
- `AuthContext` (`src/context/AuthContext.tsx`) holds the session and broadcasts
  `user`/`loading` via `useAuth()`.
- When Supabase keys are missing, `src/lib/supabaseClient.ts` swaps in a **MockAuthClient**
  (localStorage-backed) so the whole flow works offline.

### Invites flow

1. `NewCompetitionPage` → user picks candidates in `TeamMatch`.
2. `createCompetition()` creates competition + workspace + owner membership + default
   kanban columns + default timeline steps.
3. `sendInvite()` fires for each invited member (duplicate invites are tolerated).
4. Recipient accepts/declines in the Dashboard settings drawer; accepting navigates into
   the workspace via the `accept_invite` RPC.

---

## 10. AI service

A separate FastAPI microservice that fronts Google Gemini.

### Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | `{ "message": "SprintSpace AI Backend" }` |
| `GET` | `/health/gemini` | Probes Gemini with "Reply with only the word OK" and reports reachability. |
| `POST` | `/ai/planner` | Generates a sprint plan from a project brief (see below). |

### `POST /ai/planner`

**Request** (`PlannerRequest`):

```json
{
  "competition": "Web Wonders 2026",
  "project_idea": "A chrome extension that turns your to-do list into an arcade game.",
  "deadline": "2026-09-01",
  "team": [
    { "name": "Aira", "skills": ["React", "Tailwind"] },
    { "name": "Sid",  "skills": ["Python", "FastAPI"] }
  ]
}
```

**Response:** JSON parsed from Gemini's answer (the engine strips Markdown code fences
before `json.loads`). The prompt (`app/prompts/planner_prompt.py`) instructs the model to
return:

1. Milestones
2. Small actionable tasks
3. A suggested assignment of each task to the best team member
4. A suggested timeline

**Pipeline:** `routes/planner.py` → `planner_engine.generate_plan()` →
`build_planner_prompt(data)` → `gemini_client.client.models.generate_content(...)` →
strip fences → `json.loads`.

### Integration status

The endpoint exists and is testable via `curl`/`/docs`, but **no frontend calls it yet**.
Natural integration points when you wire it up:

- **`AskAIWidget`** (`src/components/workspace/AskAIWidget.tsx`) — feed the current
  workspace's kanban/team/timeline to a new endpoint and render the chat.
- **Workspace health score / deadline risk** — `health_engine.py` and `schemas/health.py`
  are empty stubs, ready for a Gemini-driven score.
- **TeamMatch match scores** — currently stored/computed in `candidates.match_score`;
  could be AI-derived from skills + project description.

---

## 11. Design system

| Token | Value | Tailwind |
|---|---|---|
| Background | `#0A0A0A` | `bg-ink` |
| Card background | `#101010` | `bg-card` |
| Surface (nested cards) | `#1A1A1A` | `bg-surface` |
| Primary text | `#DEDBC8` | `text-primary` |
| Accent | `#FF5B2E` | `text-accent` / `bg-accent` |
| Headlines / wordmarks | Orbitron | `font-display` |
| Body | Inter | `font-sans` (default) |
| Technical / HUD labels | Space Mono | `font-mono` |

- **`.liquid-glass`** (`src/index.css`) — frosted panel with gradient border, used on the
  nav pill and floating buttons.
- **Notable custom systems:**
  - **Globe** (`src/sections/GlobeSection.tsx`) — real country borders from
    `src/data/countries.json` (generated from world-atlas, bundled locally), rendered with
    `react-globe.gl`. Click a country for its (mock) active-user count.
  - **Black holes** (`src/components/deadline/BlackHoleCountdown.tsx`, hero) — canvas 2D
    particle sims, not video. The Workspace one tracks a real countdown and reddens as the
    deadline approaches.
  - **Gravity pull** — a reusable hook that warps target elements toward a "black hole" as
    the cursor approaches (hero headline, workspace stat cards).
  - **Constellation archive** (`src/components/archive/ConstellationField.tsx`) — shipped
    projects as stars (size/brightness by result), connected when they share tech stack;
    real DOM buttons so it stays keyboard/screen-reader accessible.
  - **Hero spotlight reveal** (`src/components/hero/RevealMask.tsx`) — a cursor-tracked
    canvas mask revealing a clean dashboard mockup over a "chaotic scattered tools" mockup.

---

## 12. Deploying to Vercel

1. Push to GitHub and import the repo at vercel.com — Vite is auto-detected.
2. `vercel.json` already rewrites all routes to `/index.html`, so deep links like
   `/workspace/abc` don't 404 on refresh. No extra config needed.
3. Environment variables: Project Settings → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
4. Deploy. `npm run build` is verified clean.

The AI service is a separate process — deploy it wherever Python runs (Railway, Fly.io,
Render, Cloud Run, etc.) and point the frontend at its public URL.

---

## 13. Project status

**Done and working**

- Full React + Vite + TypeScript frontend, all routes, lazy-loaded.
- Supabase integration: auth (email/password + mock fallback), profiles, workspaces,
  kanban, timeline, invites, resources (+ file storage), archive (soft-delete/restore),
  candidates, competition creation, and the `get_workspace` / `accept_invite` RPCs.
- Mock-data fallback everywhere so the app runs with zero config.
- FastAPI + Gemini AI service with a working `/ai/planner` endpoint + health probe.

**Not yet done / next steps**

- **AI ↔ frontend wiring.** `AskAIWidget` and workspace health/insights aren't connected
  to the AI service yet; the `/ai/planner` endpoint has no UI. `health_engine.py` and
  `schemas/health.py` are stubs.
- **Kanban is not drag-and-drop** — tasks render in columns but aren't reorderable (would
  need `dnd-kit` + a persistence endpoint).
- **SprintRoom chat is mock UI** — messages and online members are static arrays, not
  realtime (a `realtime: presence` + chat table would make it live).
- **TeamMatch match scores** are stored numbers, not computed by AI yet.
- **Archive/backup of the AI service**: no CI/tests for `ai-service` yet.
