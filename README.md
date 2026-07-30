# SprintSpace

The AI-powered operating system for student hackathons and competitions — one workspace
for discovering competitions, matching teammates, planning sprints, and shipping
projects, instead of six apps stitched together with WhatsApp threads.

This README is written for whoever picks this up next — mainly **backend devs joining
the project**. The frontend is functionally complete; what's missing everywhere is a
real backend, and this doc tells you exactly where to plug one in.

---

## 1. Quick start

```bash
npm install
cp .env.example .env      # optional, only needed for the Spotify player — see §7
npm run dev
```

Open the printed `localhost` URL. That's it — no database, no backend, nothing else
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
| Animation | Framer Motion (page/scroll animations), plus hand-built canvas/WebGL for the globe, black holes, and constellation |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` (used only for the globe) |
| Forms | React Hook Form + Zod |
| Fonts | Inter (body), Orbitron (headlines/wordmarks), Space Mono (HUD labels) — all self-hosted via `@fontsource/*`, zero external font CDN dependency |
| Music | Spotify Web Playback SDK + Web API (PKCE OAuth, no backend needed) |

Nothing here needs a Node server to run — it's a static site. Deploys as-is to Vercel,
Netlify, or any static host.

---

## 3. Project structure

```
src/
├─ api/            ← THE IMPORTANT FOLDER. See §4.
├─ pages/          ← one file per route (see §5)
├─ sections/       ← big page sections (Hero, About, Features, Globe)
├─ components/
│  ├─ layout/      ← Navbar, Footer, PageShell, AuthLayout (shared chrome)
│  ├─ hero/        ← hero-specific pieces (chaos/clean mockups, spotlight mask, black hole)
│  ├─ deadline/     ← BlackHoleCountdown
│  ├─ archive/      ← ConstellationField
│  ├─ music/        ← MusicPlayer (floating Spotify widget)
│  ├─ reactbits/    ← third-party animation primitives, lightly modified (see §8)
│  └─ animations/   ← small reusable text/scroll animation components
├─ hooks/           ← useAsyncData, useGravityPull, useSpotifyPlayer
├─ lib/             ← spotifyAuth, spotifyApi, authSchemas (Zod)
├─ data/            ← countries.json + useCountryUsers (globe data)
└─ App.tsx          ← routes are all defined here
```

---

## 4. The data layer — read this before writing any backend code

**Every page gets its data through an `async function` in `src/api/`, never a hardcoded
array directly in a component.** Each one currently returns mock data wrapped in a
simulated network delay (`src/api/mockClient.ts`) — built that way on purpose:

- Every page already has real loading skeletons and empty states, not just a
  permanently-full grid.
- Swapping mock → real is a **one-file change per entity**: replace the body of the
  function with a real `fetch()` to your endpoint, keep the same return type. Nothing in
  any component needs to change.
- `src/api/types.ts` is the actual data contract — treat it as the spec to build your
  endpoints against.

| Page | Route | Calls | Defined in |
|---|---|---|---|
| Discover | `/discover` | `getCompetitions()` | `src/api/competitions.ts` |
| TeamMatch | `/teammatch` | `getCandidates()` | `src/api/candidates.ts` |
| Resource Hub | `/resources` | `getResourceSections()` | `src/api/resources.ts` |
| Archive | `/archive` | `getArchiveProjects()` | `src/api/archive.ts` |
| Workspace | `/workspace` | `getWorkspace()` | `src/api/workspace.ts` |
| Landing (globe) | `/` | `useCountryUsers()` | `src/data/useCountryUsers.ts` |

Example — this is the entire diff needed to go live on real data:

```ts
// src/api/competitions.ts

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

Every page already calls its API function through `useAsyncData()` (`src/hooks/useAsyncData.ts`),
a tiny generic hook that gives you `{ data, loading, error }` — so loading/error UI is
already wired up and doesn't need touching either.

**Not yet on this pattern:** `LoginPage` and `SignupPage` simulate their own request
inline (a `setTimeout`, see the `onSubmit` handler in each) rather than going through
`src/api/`. Wire real auth there — that's the one place still needing a small refactor
rather than a one-line swap.

---

## 5. Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Landing | Hero, globe, AI Context Engine section, features |
| `/workspace` | Workspace | Kanban, team dashboard, timeline, deadline countdown |
| `/discover` | Discover | Browse competitions |
| `/teammatch` | TeamMatch | AI-matched teammate candidates |
| `/resources` | Resource Hub | Templates, boilerplate, mentorship links |
| `/archive` | Archive | Shipped projects, shown as a constellation |
| `/login`, `/signup` | Auth | React Hook Form + Zod validated, no backend yet |
| `/callback` | — | Spotify OAuth redirect target, not user-facing |

Every route past `/` is lazy-loaded (`React.lazy` in `App.tsx`) — visiting `/discover`
doesn't download the globe's or the Spotify player's code.

---

## 6. Notable custom systems

A few things on this site aren't off-the-shelf components — worth knowing what they are
before touching them:

- **The globe** (`src/sections/GlobeSection.tsx`) — real country border data
  (`src/data/countries.json`, generated from `world-atlas`, bundled locally), rendered
  with `react-globe.gl`. Click a country to see its (mock) active-user count.
- **Black holes** (`src/components/deadline/BlackHoleCountdown.tsx` and
  `src/components/hero/HeroBlackHole.tsx`) — canvas 2D particle sims, not video or a
  library. The Workspace one is tied to a real countdown and reddens as the deadline
  approaches; the hero one is purely ambient (no real deadline behind it).
- **Gravity pull** (`src/hooks/useGravityPull.ts`) — a reusable hook: register a "black
  hole" element and a list of "target" elements, and targets visibly warp toward the
  black hole as the cursor gets close. Used on the hero headline and the Workspace stat
  cards. Reusable anywhere else you want the same effect.
- **Constellation archive** (`src/components/archive/ConstellationField.tsx`) — shipped
  projects rendered as stars (size/brightness by result), connected by lines when they
  share tech stack, real DOM buttons under the hood (not canvas), so it's keyboard/
  screen-reader accessible.
- **Hero spotlight reveal** (`src/components/hero/RevealMask.tsx`) — cursor-tracked
  canvas mask that reveals a "clean SprintSpace dashboard" mockup through a soft circle
  over a "chaotic scattered tools" mockup underneath.
- **Chrome-hover text** — actually removed in a later pass; if you see `ChromeText`
  referenced anywhere that's stale, it shouldn't be (last verified clean via full
  repo grep).

---

## 7. Spotify music player

Floating widget, bottom-left, on every page (`src/components/music/MusicPlayer.tsx`).
Real Web Playback SDK + PKCE OAuth — no backend involved, but it does need your own
Spotify Developer credentials:

1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Create app.
2. Redirect URI, exactly: `http://127.0.0.1:5173/callback` for local dev (must be
   `127.0.0.1`, not `localhost`). Add your deployed URL + `/callback` too once you deploy.
3. Select **Web Playback SDK** + **Web API** when asked what you're using.
4. Copy the **Client ID** from Settings → paste into `.env` as `VITE_SPOTIFY_CLIENT_ID`.
5. Restart `npm run dev` (Vite only reads `.env` on startup).

Two real Spotify constraints, not bugs here: the Web Playback SDK only works for
**Premium** accounts, and new apps are capped at 25 allowlisted users until Spotify
approves an extension. Fine for internal testing/demos.

No Client ID set → the player just doesn't render. Nothing else depends on it.

---

## 8. Design system quick reference

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

`src/components/reactbits/` holds a handful of animation components pulled from the
[reactbits.dev](https://reactbits.dev) library (Threads, StarBorder, ClickSpark,
CountUp, DecryptedText, SpotlightCard, LiquidChrome) — used mostly as-is, occasionally
re-themed with SprintSpace's palette.

---

## 9. Deploying (Vercel)

1. Push to GitHub, import the repo at vercel.com. Vite is auto-detected.
2. `vercel.json` already handles SPA routing (so `/workspace` etc. don't 404 on direct
   navigation/refresh) — no extra config needed.
3. If you want the Spotify player live: Project Settings → Environment Variables → add
   `VITE_SPOTIFY_CLIENT_ID`, and add the deployed URL's `/callback` to your Spotify app's
   Redirect URIs.
4. Deploy. `npm run build` is already verified clean.

---

## 10. What's genuinely not done

Being direct about this so nobody's surprised:

- **No real backend or database anywhere.** Everything in §4 is mock data structured to
  make wiring up a real one straightforward — but there is currently zero persistence.
- **Auth is fake.** Login/Signup validate real-looking form input but don't create real
  accounts or sessions.
- **Country user counts on the globe are deterministic mock numbers**, not real signups.
- **Kanban isn't drag-and-drop yet** — tasks render in their columns but aren't
  interactive. Would need a drag library (`dnd-kit` or similar) plus a real mutation
  endpoint once there's a backend to persist reordering to.
