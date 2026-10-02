# AGENTS.md

Front-end MVP for a student residence, structured as
`Yotoqxona → Qavat → Xona → Joy → Talaba`.
React 18 · Vite 5 · TypeScript · Tailwind 3 · React Router 6 (`HashRouter`) ·
React Three Fiber · Zustand · Framer Motion.

**Live:** https://magus24.github.io/yotoqhonam/ — deploys automatically on every push to
`main` via `.github/workflows/deploy.yml`.

## Commands

```bash
npm install
npm run dev       # dev server
npm run lint      # tsc -b — this IS the typecheck; there is no separate linter
npm run build     # tsc -b && vite build  (typecheck is the gate, so lint first)
npm run preview   # serve dist/
```

`npm run lint` and `npm run typecheck` are the same `tsc -b`; there is no ESLint/Prettier in
this project, so **`npm run build` is the only real gate.** `strict`, `noUnusedLocals` and
`noUnusedParameters` are on — an unused import fails the build.

CI runs `npm ci` → `npm run lint` → `npm run build`. The workflow fails on any type error.

## Traps that will bite you

**`@/*` is a fake alias.** `tsconfig.json` declares `paths: { "@/*": ["src/*"] }` but
`vite.config.ts` has **no matching `resolve.alias`**. An `@/components/...` import will
typecheck cleanly and then fail the Vite build. Use relative imports (`../components/...`) —
that is what all 42 files under `src/` actually do. Either add the alias to Vite or delete it
from tsconfig; do not leave it half-wired.

**Bare Tailwind color families drop opacity modifiers silently.** `graphite`, `mint`,
`brass`, `forest`, `indigo` and `ink` have **no `DEFAULT`** key in `tailwind.config.js`.
`bg-graphite-950/10` compiles; `bg-graphite/10` compiles to *nothing* — no error, no style.
Always name an explicit shade. Same for `border-brass/25`.

**`ROOM_VISUALS.glow` is decorative only.** Inline `style={{ color: state.glow }}` fails
WCAG AA on the light theme. Text must use `state.text`; fills use `state.tint`; only dots,
rings and glows use `glow`.

**Dates are local, never UTC.** Duty records are keyed by `todayISO()` (local
`YYYY-MM-DD`). Filtering or seeding duties with `new Date().toISOString().slice(0,10)` is
wrong and silently mismatches across the UTC day boundary.

**Photos live in `localStorage`.** `compressImage` bounds uploads to 1280px / JPEG q0.72
before persisting, because raw phone photos exceed the ~5 MB storage quota. Always route
uploads through `src/lib/image.ts` rather than storing raw data URLs.

**`STORAGE_KEYS.theme` and `.prefs` are dead.** The theme toggle was removed during the
light-theme migration; those keys are unreferenced. Don't wire them back up.

**`Bed.studentId` is the only occupancy truth.** A room is not "full" because a
`Room.capacity` number says so, and `Student` must never grow a `roomId`/`bedId`. Move,
evict and delete all reconcile through `beds`. Copying the occupant onto the student is how
"room 205 shows two people" bugs get in.

**Admin edits one residence at a time.** `useAllRooms()`/`useOccupancy()` see the whole
estate; the warden tabs (`useDormRooms`, `useDormBeds`, `useDormOccupancy`,
`useDormHistoryRooms`) see only `activeDormitoryId`. Dashboard/Landing/Login/Floor may stay
global, but anything shown under the Admin residence selector must follow
`useDorm*`. The duty *queue* stays estate-wide, so history filters with `inScope()` rather
than being rebuilt.

## Architecture

- **No backend.** All state is Zustand + `localStorage` (`yotoqhonam.state.v1`,
  `yotoqhonam.session.v1`). `src/lib/storage.ts` is deliberately defensive — every access
  is try/caught so disabled storage degrades to in-memory instead of a blank screen.
- **One registry, many views.** `src/data/registry.ts` owns pure derivations and rules
  (occupancy, `nextRoomSlot`, validation) with no React and no storage; `dormStore` owns
  mutations; `src/store/useRegistry.ts` exposes memoised views. Screens must not recompute
  occupancy or reach into raw arrays.
- **Hooks derive from raw slices.** Every hook subscribes to a stable persisted array and
  derives with `useMemo`; a selector that builds a new array would break the store's
  identity check and spin `useSyncExternalStore`.
- **`HashRouter` is deliberate.** Pages has no SPA rewrite, so `/#/floor` survives a hard
  refresh while `/floor` would 404. Don't migrate to `BrowserRouter` without adding a
  server-side fallback.
- **`base: './'`** in `vite.config.ts` is what lets the build run from any Pages sub-path.
  Never introduce a root-absolute `/assets/...` reference.
- Routes are lazy-loaded in `src/App.tsx`; `three` is a separate `manualChunks` entry
  (~850 kB) so the landing page doesn't pay for it.

### Persisted schema

`DemoState` is `version: 2` and still stored under the `yotoqhonam.state.v1` key. It adds
`dormitories`, `floors`, `rooms`, `beds`, `students` and `assignmentHistory` to the duty
data. `loadState()` upgrades a v1 payload in place and **writes the result back
immediately** — a version bump that is not flushed leaves the migration to run again on
every load. `activeDormitoryId` picks which residence Admin and the 3D floor show.

The duty ring survives a schema bump and a new calendar day: when today has no records,
`withTodayDuties()` appends `makeDutiesForDay(queue)` for offsets `-2`, `-1` and `0`, which
keeps the registry, the history and the filed reports intact.

### 3D floor

Every canvas is mounted through `DeferredFloorCanvas` (`AppShell.tsx`) → `SceneBoundary`.
**Always use `DeferredFloorCanvas`, never a raw `<Canvas>`** — it is what provides the
no-WebGL fallback and the visibility-gated `frameloop`.

Two non-negotiable constraints:

- **R3F `<Canvas>` children must be three.js elements.** Room labels are projected to
  position inside the canvas but the DOM nodes live *outside* it, wired via the `labelRefs`
  map. Putting JSX into `<Canvas>` crashes the renderer.
- **The floor plan is a closed ring.** Rooms form a loop, so index `[-1]` is the room before
  the first one, not after the last. `HandoverLine` builds explicit segments for this reason —
  copy that approach instead of reaching for negative indices.

### The duty ring

`completeDuty` rotates the queue from the **completed room's own index**, so the cycle runs
`205 → 206 → 207 → 204 → 205`. Rotating from the head walks the ring backwards. If you touch
this, verify a full four-step cycle, not just one handover.

## Verification

There is **no committed test suite and no Playwright dependency.** Verification was done
with Playwright scripts written to a temp directory (`%TEMP%\opencode\*.py`), each accepting
a base URL so they can be pointed at production: `admin_crud.py` (warden CRUD, assignment,
move, eviction), `multidorm.py` (residence selector scoping, dormitory create/delete),
`migration.py` (v1 upgrade and calendar rollover), `ring.py`, `nowebgl.py` and
`overflow.py`.

If you add automated checks, commit them and add Playwright to `devDependencies` — right now
a fresh clone has zero test coverage and nothing will catch a regression.

Before calling a change done, at minimum run `npm run lint && npm run build` and confirm on a
real page that: no console errors, no horizontal overflow at 390 / 834 / 1440, and the WebGL
fallback still renders when WebGL is disabled. **`tsc` will not save you from a misplaced
`return` inside a `.map()` callback** — it typechecks — so eyeball the rendered panel.

## Conventions

- Product copy is **Uzbek for structure, English for body prose**. Admin tabs are Uzbek
  (`Talabalar`, `Joylar`, `Xonalar`, `Qavatlar`, `Navbatchilik`); keep them that way.
- Positioning matters: this is a **residence management platform**. Duty rotation and photo
  reports are a feature, not the product. Do not let landing or dashboard copy drift back to
  leading with cleaning/duty.
- Light theme only. The theme toggle was intentionally removed. `ink-950` is the *page
  background* (`#F1F5F9`), not near-black — easy to misread.
- `SectionTitle` renders an `<h2>`; page-level empty states must pass `as="h1"` to
  `EmptyState` so the document outline stays intact.
- Every canvas is wrapped in `AppBoundary` (top level) and `SceneBoundary` (3D) so a render
  failure shows a message instead of a white screen.

## Known state

`npm audit` reports 4 advisories (1 high). None affect the deployed output: `vite` and
`esbuild` are dev-only, and both router advisories need attacker-controlled navigation
targets or SSR, neither of which this static SPA has. Clearing them requires breaking
upgrades (Vite 5→8, React Router 6→7) — do not do this casually.
