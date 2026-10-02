# Yotoqhonam

**Talabalar turar joyini raqamli boshqarish platformasi** — front-end MVP for managing a
student residence, structured as `Yotoqxona → Qavat → Xona → Joy → Talaba`.

**Live demo:** https://magus24.github.io/yotoqhonam/

Demo accounts (any password of 4+ characters):

| Role     | Email                     | What you get                        |
| -------- | ------------------------- | ----------------------------------- |
| Resident | `student@yotoqhonam.demo` | Dashboard, floor plan, own room, duty |
| Warden   | `admin@yotoqhonam.demo`   | Everything plus the warden console   |

---

## What this is

One persisted register for the whole estate. A student occupies a **bed**, a bed belongs to
a room, a room to a floor, a floor to a dormitory — so occupancy, placement and status are
always one click away instead of a paper list. On top of that the floor runs its duty
rotation on its own: when a room closes its duty it passes the ring to the next room, and one
photo closes it out.

## What is not built yet

This is a front-end MVP with demo data. It has **no backend, no server and no database**.
Photos are stored as data URLs in the browser, and all state is kept in `localStorage` on the
current device. Nothing here is wired to a live campus.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind 3 · React Router 6 (`HashRouter`) ·
React Three Fiber · Zustand · Framer Motion · Lucide

No backend and no runtime dependencies beyond the packages above.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run lint     # typecheck (tsc -b)
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Deployment

Deployed automatically to GitHub Pages on every push to `main`
(`.github/workflows/deploy.yml`). The build uses `base: './'` and ships a `404.html`, so it
runs from any repository sub-path and survives forks and renames.

## Features

- **Landing** — the live 3D floor plan is the hero; the register is shown as a real table
- **Dashboard** — where you are in the structure, the residence register, your room, the
  current duty, and the floor plan
- **3D floor** — orbit, zoom, hover and select rooms; duty status on every block; a
  cinematic intro on first open; graceful fallback when WebGL is unavailable
- **Duty** — checklist, photo upload, and a handover snapshot that keeps `From`/`To`
  consistent as the ring rotates `205 → 206 → 207 → 204 → 205`
- **Warden console** — a residence selector plus `Talabalar`, `Joylar`, `Xonalar`, `Qavatlar`,
  `Navbatchilik`, `Hisobotlar` and a build-status tab that spells out what exists and what
  does not

## The warden console

Everything below writes to the one registry, so a change is reflected on the dashboard, the
floor plan, the room page, the 3D scene and the duty rota immediately — and survives a
reload, because the store persists on every mutation.

| Tab         | What you can do                                                                  |
| ----------- | -------------------------------------------------------------------------------- |
| `Yotoqxona` | Rename the residence, add another one, delete an empty one                       |
| `Qavatlar`  | Add, rename and delete floors; add a room to a floor; see per-floor occupancy     |
| `Xonalar`   | Create and edit rooms — number, capacity, and whether they are on the rotation     |
| `Joylar`    | The bed grid of the selected residence: green is taken, dashed is free            |
| `Talabalar` | Create and edit students, place them in a free bed, move them, or evict them      |
| `Navbatchilik` / `Hisobotlar` | The duty log and the filed photo reports for this residence           |
| `Stack`     | Build status and what a backend would replace                                     |

The rules the store enforces, not just the UI: room and floor numbers are unique within
their parent, capacity stays between 1 and 12 and can never drop below the beds already
handed out, a bed holds at most one student, a floor with rooms cannot be deleted, an
occupied room must be emptied first, and the last residence cannot be removed. Every
placement, move and eviction is recorded in an assignment history.

Occupancy is always derived from `Bed.studentId`, never copied onto the student record, so a
place cannot show two people. When two or more residences exist, the selector in the header
scopes the tabs, the statistics and the history to the selected one.

## Verification

Automated browser checks pass against the build, with 0 console errors and no horizontal
overflow at 390 / 834 / 1440 on every route and Admin tab. Covered: the warden CRUD
lifecycle (create, place, move, evict, delete), residence selector scoping, the v1 → v2
storage migration and the calendar-day rollover, the duty ring end-to-end including the photo
flow, and the WebGL-disabled fallback.

## Known dependency advisories

`npm audit` reports 4 advisories (1 high). None affect the deployed output: `vite` and
`esbuild` are dev-only and never reach Pages, and both router advisories require
attacker-controlled navigation targets or SSR, which this static `HashRouter` SPA does not
use. Clearing them would require breaking upgrades (Vite 5→8, React Router 6→7).