# Yotoqhonam

**Talabalar turar joyini raqamli boshqarish platformasi** — front-end MVP for managing a
student residence, structured as `Yotoqxona → Qavat → Xona → Talaba`.

**Live demo:** https://magus24.github.io/yotoqhonam/

Demo accounts (any password of 4+ characters):

| Role     | Email                     | What you get                        |
| -------- | ------------------------- | ----------------------------------- |
| Resident | `student@yotoqhonam.demo` | Dashboard, floor plan, own room, duty |
| Warden   | `admin@yotoqhonam.demo`   | Everything plus the warden console   |

---

## What this is

A single register for the whole residence. A resident belongs to a room, a room to a floor,
a floor to one dormitory — so occupancy and status are always one click away instead of a
paper list. On top of that the floor runs its duty rotation on its own: when a room closes
its duty it passes the ring to the next room, and one photo closes it out.

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
- **Warden console** — `Talabalar`, `Xonalar`, `Qavatlar`, `Navbatchilik`, `Hisobotlar`,
  and a build-status tab that spells out what exists and what does not

## Verification

104 automated browser checks pass against the deployed site, with 0 console errors, no failed
network requests, 0 WCAG AA contrast failures across all routes, and no horizontal overflow
at 390 / 834 / 1440. The duty ring is verified end-to-end including the photo flow, and the
WebGL-disabled fallback is covered on every route.

## Known dependency advisories

`npm audit` reports 4 advisories (1 high). None affect the deployed output: `vite` and
`esbuild` are dev-only and never reach Pages, and both router advisories require
attacker-controlled navigation targets or SSR, which this static `HashRouter` SPA does not
use. Clearing them would require breaking upgrades (Vite 5→8, React Router 6→7).