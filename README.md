# SprintSpace

The AI-powered operating system for student hackathons and competitions — one workspace
for discovering competitions, matching teammates, planning sprints, and shipping
projects, instead of six apps stitched together with WhatsApp threads.

---

## 1. Quick start

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. No database, no backend, no environment variables
required to run this locally.

**Build for production:**
```bash
npm run build     # outputs to dist/, verified clean
npm run preview   # serve the production build locally to sanity-check it
```

---

## 2. Tech stack

| Layer | What |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router (client-side, code-split per route) |
| Animation | Framer Motion, plus hand-built canvas/WebGL for the globe, black hole, and constellation |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` (globe only) |
| Forms | React Hook Form + Zod |
| Fonts | Inter (body), Orbitron (headlines/wordmarks), Space Mono (HUD labels) — all self-hosted via `@fontsource/*`, zero external font CDN dependency |

Static site — no Node server required to run it. Deploys as-is to Vercel, Netlify, or
any static host.

---

## 3. Project structure

```
src/
├─ api/            ← the data layer — see §4, this is the important folder
├─ pages/           ← one file per route (see §5)
├─ sections/         ← big page sections (Hero, About, Features, Globe)
├─ components/
│  ├─ layout/       ← Navbar, Footer, PageShell, AuthLayout, SkeletonCard
│  ├─ hero/         ← chaos/clean mockups, cursor-spotlight mask, ambient background
│  ├─ deadline/      ← BlackHoleCountdown
│  ├─ archive/       ← ConstellationField
│  ├─ reactbits/     ← animation primitives from reactbits.dev, lightly re-themed
│  └─ animations/    ← reusable text/scroll animation components
├─ hooks/            ← useAsyncData
├─ lib/              ← authSchemas (Zod)
└─ data/             ← countries.json + useCountryUsers (globe data)
```

---

## 4. The data layer — read this before writing a backend

**Every page gets its data through an `async function` in `src/api/`, never a hardcoded
array directly in a component.** Each one currently returns mock data through a
simulated network delay (`src/api/mockClient.ts`) — built that way on purpose:

- Every page already has real loading skeletons (`SkeletonCard`) and empty states, not
  just a permanently-full grid.
- Swapping mock → real is a **one-file change per entity**: replace the body of the
  function with a real `fetch()`, keep the same return type. No component needs to
  change.
- `src/api/types.ts` is the actual data contract — the spec to build a backend against.

| Page | Route | Calls | Defined in |
|---|---|---|---|
| Discover | `/discover` | `getCompetitions()` | `src/api/competitions.ts` |
| TeamMatch | `/teammatch` | `getCandidates()` | `src/api/candidates.ts` |
| Resource Hub | `/resources` | `getResourceSections()` | `src/api/resources.ts` |
| Archive | `/archive` | `getArchiveProjects()` | `src/api/archive.ts` |
| Workspace | `/workspace` | `getWorkspace()` | `src/api/workspace.ts` |
| Landing (globe) | `/` | `useCountryUsers()` | `src/data/useCountryUsers.ts` |

Example — the entire diff needed to go live on real data for one entity:

```ts
// BEFORE (mock)
export async function getCompetitions(): Promise<Competition[]> {
  return mockDelay(COMPETITIONS);
}

// AFTER (real)
export async function getCompetitions(): Promise<Competition[]> {
  const res = await fetch('/api/competitions');
  return res.json();
}
```

**Not yet on this pattern:** `LoginPage` and `SignupPage` simulate their own request
inline rather than going through `src/api/` — real auth needs its own design (sessions
vs. JWT), not a one-line swap.

---

## 5. Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Landing | Hero, globe, AI Context Engine section, features |
| `/workspace` | Workspace | Kanban, team dashboard, black-hole deadline countdown |
| `/discover` | Discover | Browse competitions, category filter |
| `/teammatch` | TeamMatch | AI-matched teammate candidates |
| `/resources` | Resource Hub | Templates, boilerplate, mentorship links |
| `/archive` | Archive | Shipped projects, rendered as a constellation |
| `/login`, `/signup` | Auth | React Hook Form + Zod validated, no backend yet |

Every route past `/` is lazy-loaded (`React.lazy` in `App.tsx`) — visiting `/discover`
doesn't download the globe's code.

---

## 6. Notable custom systems

A few things here aren't off-the-shelf components — worth knowing what they are before
touching them:

- **The hero** (`src/sections/Hero.tsx`, `src/components/hero/`) — a cursor-tracked
  canvas mask (`RevealMask.tsx`) reveals a clean SprintSpace dashboard mockup through a
  soft circle, over a scattered "chaotic pre-SprintSpace tools" mockup underneath. Real
  canvas radial-gradient + CSS `mask-image`, not a CSS-only trick. Sits over a live
  WebGL ambient background layer standing in for cinematic video (no real footage was
  available to use), plus a HUD layer: scanlines, corner brackets, a monospace eyebrow
  tag, an independent cursor-following glow.
- **The globe** (`src/sections/GlobeSection.tsx`) — real country border data
  (`src/data/countries.json`, generated from `world-atlas`, bundled locally, no runtime
  fetch for the shapes), rendered with `react-globe.gl`. Click a country to see its
  (mock, deterministic) active-user count animate in.
- **Black hole deadline** (`src/components/deadline/BlackHoleCountdown.tsx`) — a canvas
  2D accretion-disk particle simulation, not a video or a library. Particles fall faster
  and shift red as the real deadline gets closer; a live countdown ticks in the center.
- **Constellation archive** (`src/components/archive/ConstellationField.tsx`) — shipped
  projects rendered as stars, sized and colored by result, connected by lines when they
  share tech stack, drifting slightly with the cursor for parallax depth. These are real
  DOM buttons under the hood, not canvas pixels — keyboard/screen-reader reachable.

---

## 7. Design system

| Token | Value | Tailwind |
|---|---|---|
| Background | `#0A0A0A` | `bg-ink` |
| Card background | `#101010` | `bg-card` |
| Surface (nested cards) | `#1A1A1A` | `bg-surface` |
| Primary text | `#DEDBC8` | `text-primary` |
| Accent | `#FF5B2E` | `text-accent` / `bg-accent` |
| Headlines/wordmarks | Orbitron | `font-display` |
| Body | Inter | `font-sans` (default) |
| Technical/HUD labels | Space Mono | `font-mono` |

`.liquid-glass` (in `src/index.css`) is the frosted-panel-with-gradient-border effect
used on the nav pill — reusable anywhere via `className="liquid-glass"`.

`src/components/reactbits/` holds animation components pulled from
[reactbits.dev](https://reactbits.dev) (Threads, StarBorder, ClickSpark, CountUp,
DecryptedText, SpotlightCard, LiquidChrome) — used mostly as-is, occasionally re-themed
with SprintSpace's palette.

---

## 8. Deploying (Vercel)

1. Push to GitHub, import the repo at vercel.com. Vite is auto-detected.
2. `vercel.json` already handles SPA routing (so `/workspace` etc. don't 404 on direct
   navigation/refresh) — no extra config needed.
3. Deploy. `npm run build` is already verified clean.

---

## 9. What's genuinely not done

Being direct so nobody's surprised:

- **No real backend or database.** Everything in §4 is mock data structured to make
  wiring up a real one straightforward, but there's currently zero persistence.
- **Auth is fake.** Login/Signup validate real-looking input but don't create real
  accounts or sessions.
- **Country user counts on the globe are deterministic mock numbers**, not real signups.
- **Kanban isn't drag-and-drop yet** — tasks render in their columns but aren't
  interactive. Would need a drag library (`dnd-kit` or similar) plus a real mutation
  endpoint once there's a backend to persist reordering to.
