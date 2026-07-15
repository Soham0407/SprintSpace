# SprintSpace

React + Vite + TypeScript + Tailwind. Framer Motion, React Router, React Hook Form + Zod,
a Three.js globe, a Spotify player, and now a proper mock-API layer everything reads
through.

## Run it locally

npm install
cp .env.example .env   # optional — paste a Spotify Client ID if you want the music player live
npm run dev

## Deploy to Vercel

1. Push this repo to GitHub.
2. vercel.com → New Project → import the repo. Vite is auto-detected, no config needed
   beyond what's already in `vercel.json` (SPA rewrite, so `/workspace` etc. don't 404 on
   direct navigation).
3. If you want the Spotify player live for whoever you share this with: Project Settings →
   Environment Variables → add `VITE_SPOTIFY_CLIENT_ID`, then in your Spotify Developer
   app add the deployed URL + `/callback` as a second Redirect URI.
4. Deploy. That's it — `npm run build` is already verified clean.

Without a Spotify Client ID set, the music player just doesn't render — nothing else on
the site depends on it.

## The data layer (`src/api/`) — read this before wiring up a backend

Every page gets its data through an `async function get*()` in `src/api/`, not a static
import. Each one currently returns hardcoded mock data wrapped in a simulated network
delay (`mockClient.ts`) — structured that way on purpose, so:

- Every page already has real loading states (skeletons) and empty states, not just a
  hardcoded grid.
- Swapping mock → real is a **one-file change per entity** — replace the body of
  `getCompetitions()`/`getCandidates()`/etc. with a real `fetch()`, keep the same return
  type from `src/api/types.ts`. No component needs to change.
- `src/api/types.ts` is the actual contract — treat it as the API spec to build the
  backend against.

| Page | API function | File |
|---|---|---|
| Discover | `getCompetitions()` | `src/api/competitions.ts` |
| TeamMatch | `getCandidates()` | `src/api/candidates.ts` |
| Resource Hub | `getResourceSections()` | `src/api/resources.ts` |
| Archive | `getArchiveProjects()` | `src/api/archive.ts` |
| Workspace | `getWorkspace()` | `src/api/workspace.ts` |
| Globe | `useCountryUsers()` | `src/data/useCountryUsers.ts` (deterministic, not a real endpoint yet — same idea) |

Auth (`LoginPage`/`SignupPage`) still simulates its own request inline rather than going
through `src/api/` — wire those `onSubmit` handlers to real auth once it exists.

## What's new in this pass

- **Black hole deadline** (`src/components/deadline/BlackHoleCountdown.tsx`) — canvas
  accretion-disk particle sim, live ticking countdown, particles fall faster and redden
  as the deadline approaches. On the Workspace page, given real space rather than a small
  stat tile.
- **Constellation archive** (`src/components/archive/ConstellationField.tsx`) — shipped
  projects as stars (brighter/bigger for bigger wins), connected by shared-tech-stack
  lines, parallax on mouse move, click a star for details. Real DOM buttons under the
  hood (not canvas), so it's accessible/keyboard-reachable, not just decorative.
- **Fonts, everywhere this time**: Orbitron for headlines/wordmarks (nav, footer, auth,
  every page title), Space Mono for HUD-style technical labels, Inter for body copy.
  Nothing left on the default system font stack.
- **Vercel-ready**: `vercel.json` added, build verified clean, SPA routing handled.

## Performance

Main bundle ~143 KB gzip. Every route past `/` code-split. Globe (below the fold on `/`)
is the one big lazy chunk at ~690 KB gzip — mostly `three-globe` + bundled country
boundary data, loads well after first paint.
