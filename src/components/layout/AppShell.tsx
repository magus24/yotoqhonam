import { Suspense, lazy, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Boxes, ClipboardCheck, LayoutGrid, LogOut, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDormStore } from '../../store/dormStore';
import { useDormitory, useFloor, useRoom, useUserRoom } from '../../store/useRegistry';
import type { Room } from '../../data/types';
import { cn, firstName } from '../../lib/utils';
import { KeyTag } from '../ui/Primitives';
import { ButtonLink } from '../ui/Button';
import { SceneBoundary } from '../three/SceneBoundary';

/* The 3D bundle is ~600 kB. Keeping it out of the login/landing path means
   the first paint never waits on WebGL. */
const FloorCanvas = lazy(() =>
  import('../three/FloorScene').then((m) => ({ default: m.FloorCanvas })),
);

export interface FloorCanvasProps {
  rooms: Room[];
  queue: string[];
  activeRoomId: string | null;
  nextRoomId: string | null;
  ownRoomId: string | null;
  dutyStatus: string | null;
  selectedRoomId: string | null;
  onSelect: (id: string | null) => void;
  mode: 'explore' | 'hero';
  reducedMotion: boolean;
}

export function DeferredFloorCanvas(props: FloorCanvasProps) {
  return (
    <SceneBoundary>
      <Suspense
        fallback={
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-3 text-sm text-text-mist">
              <span className="size-2 animate-ping rounded-full bg-brass-400" />
              Preparing the floor plan
            </div>
          </div>
        }
      >
        <FloorCanvas {...props} />
      </Suspense>
    </SceneBoundary>
  );
}

const NAV = [
  { to: '/dashboard', label: 'Overview', Icon: LayoutGrid },
  { to: '/floor', label: 'Floor plan', Icon: Boxes },
  { to: '/duty', label: 'Duty', Icon: ClipboardCheck },
  { to: '/admin', label: 'Admin', Icon: Users },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const duties = useDormStore((s) => s.duties);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const navigate = useNavigate();
  const location = useLocation();

  const dormitory = useDormitory();
  const activeDuty = duties.find((d) => d.id === activeDutyId) ?? null;
  const activeRoom = useRoom(activeDuty?.roomId);
  const ownRoom = useUserRoom(user);
  const activeFloor = useFloor(activeRoom?.floorId);

  useEffect(() => {
    document.getElementById('page-top')?.scrollIntoView({ block: 'start' });
  }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative min-h-dvh lg:flex">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="blueprint absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(120%_80%_at_50%_0%,#000_20%,transparent_75%)]" />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Rail: reads like a key fob, not a generic sidebar                 */}
      {/* ---------------------------------------------------------------- */}
      <aside className="sticky top-0 z-40 hidden h-dvh w-[var(--rail-w)] shrink-0 flex-col items-center border-r border-graphite-950/[0.09] bg-ink-900/70 py-5 backdrop-blur-xl lg:flex">
        <BrandMark />
        <nav className="mt-8 flex flex-1 flex-col items-center gap-1.5" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <RailLink key={to} to={to} label={label}>
              <Icon className="size-[19px]" strokeWidth={1.6} />
            </RailLink>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-2">
          {ownRoom ? (
            <span className="plate px-1.5 py-0.5 text-[10px]" title={`Home room ${ownRoom.number}`}>
              {ownRoom.number}
            </span>
          ) : null}
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="grid size-10 place-items-center rounded-xl text-text-mist transition-colors hover:bg-alert/12 hover:text-alert"
          >
            <LogOut className="size-[17px]" strokeWidth={1.6} />
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-graphite-950/[0.08] bg-ink-950/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark />
          </div>
          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <span className="engrave shrink-0">{dormitory?.name ?? 'Yotoqxona'}{activeFloor ? ` / ${activeFloor.name}` : ''}</span>
            {activeRoom ? (
              <span className="flex items-center gap-2 text-xs text-text-mist">
                <span className="size-1 animate-pulse rounded-full bg-brass-400" />
                Duty with room {activeRoom.number}
              </span>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {activeRoom ? (
              <ButtonLink to="/duty" size="sm" variant="ghost" className="hidden sm:inline-flex">
                Open duty
              </ButtonLink>
            ) : null}
            {user ? (
              <div className="flex items-center gap-2.5">
                <KeyTag initials={user.initials} tone={ownRoom?.id === activeDuty?.roomId ? 'brass' : 'mint'} />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-medium text-text">{firstName(user.name)}</p>
                  <p className="engrave">{ownRoom ? `Room ${ownRoom.number}` : user.role}</p>
                </div>
              </div>
            ) : null}
            <button
              onClick={handleSignOut}
              className="grid size-9 place-items-center rounded-xl text-text-mist transition-colors hover:bg-graphite-950/[0.07] hover:text-text lg:hidden"
              aria-label="Sign out"
            >
              <LogOut className="size-[17px]" strokeWidth={1.6} />
            </button>
          </div>
        </header>

        <main id="page-top" className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-9 lg:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile tab bar                                                    */}
      {/* ---------------------------------------------------------------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-graphite-950/[0.09] bg-ink-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Main"
      >
        {NAV.map(({ to, label, Icon }) => (
          <TabLink key={to} to={to} label={label}>
            <Icon className="size-[19px]" strokeWidth={1.6} />
          </TabLink>
        ))}
      </nav>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BrandMark() {
  return (
    <NavLink to="/dashboard" aria-label="Yotoqhonam home" className="group grid place-items-center">
      <span className="relative grid size-9 place-items-center rounded-[10px] border border-brass-400/40 bg-brass-400/12">
        <span className="font-mono text-[13px] font-bold tracking-tight text-brass-600">YQ</span>
        <span className="absolute inset-0 rounded-[10px] opacity-0 shadow-lamp transition-opacity duration-500 group-hover:opacity-100" />
      </span>
    </NavLink>
  );
}

function RailLink({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      className={({ isActive }) =>
        cn(
          'group relative grid size-10 place-items-center rounded-xl transition-colors duration-300',
          isActive ? 'text-brass-600' : 'text-text-dim hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="rail-active"
              className="absolute inset-0 rounded-xl border border-brass-400/30 bg-brass-400/10"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          ) : null}
          <span className="relative">{children}</span>
          <span className="pointer-events-none absolute left-[calc(100%+8px)] z-50 hidden whitespace-nowrap rounded-lg border border-graphite-950/10 bg-ink-850 px-2.5 py-1.5 text-xs text-text opacity-0 shadow-lift transition-opacity group-hover:opacity-100 lg:block">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function TabLink({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
          isActive ? 'text-brass-600' : 'text-text-dim',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="tab-active"
              className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brass-400"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          ) : null}
          {children}
          {label}
        </>
      )}
    </NavLink>
  );
}
