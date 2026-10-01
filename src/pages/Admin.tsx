import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, HardDrive, ShieldCheck, Users } from 'lucide-react';
import { DORMITORY, FLOORS, ROOMS, USERS, residentsOf } from '../data/mock';
import { getNextDutyRoom, ROOM_VISUALS } from '../data/dutyQueue';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState, KeyTag, SectionTitle, Stat } from '../components/ui/Primitives';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { cn, formatClock, formatShortDate, todayISO } from '../lib/utils';
import type { Room } from '../data/types';

const TABS = [
  { id: 'students', label: 'Talabalar', hint: 'Students' },
  { id: 'rooms', label: 'Xonalar', hint: 'Rooms' },
  { id: 'floors', label: 'Qavatlar', hint: 'Floors' },
  { id: 'duty', label: 'Navbatchilik', hint: 'Duty rota' },
  { id: 'reports', label: 'Hisobotlar', hint: 'Reports' },
  { id: 'stack', label: 'Stack', hint: 'Build status' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('students');
  const [roomModal, setRoomModal] = useState<Room | null>(null);

  const duties = useDormStore((s) => s.duties);
  const queue = useDormStore((s) => s.queue);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const resetDemo = useDormStore((s) => s.resetDemo);

  const ring = useMemo(
    () => queue.map((q) => ROOMS.find((r) => r.id === q)).filter((r): r is Room => Boolean(r)),
    [queue],
  );
  const activeDuty = duties.find((d) => d.id === activeDutyId) ?? null;
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const todaysDuties = duties.filter((d) => d.date === todayISO());
  const completed = todaysDuties.filter((d) => d.status === 'completed');
  const occupiedRooms = ROOMS.filter((r) => residentsOf(r.id).length > 0).length;
  const totalBeds = ROOMS.reduce((n, r) => n + r.capacity, 0);

  if (user && user.role !== 'admin') {
    return (
      <EmptyState as="h1"
        title="This area is for the warden"
        body={`You are signed in as a resident of room ${ROOMS.find((r) => r.id === user.roomId)?.number ?? '—'}. Sign in with the admin demo account to see the floor register.`}
        action={
          <ButtonLink to="/dashboard" variant="ghost" size="sm">
            Back to overview
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="engrave">Warden console</p>
          <h1 className="mt-2.5 font-display text-display-sm font-semibold leading-[1] text-text">
            {DORMITORY.name}
          </h1>
          <p className="mt-2 text-sm text-text-mist">{DORMITORY.address}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetDemo();
              toast.success('Demo reset', 'Duties and reports are back to their starting state.');
            }}
          >
            Reset demo data
          </Button>
          {user?.role === 'admin' ? (
            <Button
              size="sm"
              onClick={() => {
                const link = `${window.location.origin}${window.location.pathname}#/login`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(link).then(
                    () => toast.info('Demo link copied', link),
                    () => toast.info('Demo link', link),
                  );
                } else {
                  toast.info('Demo link', link);
                }
              }}
            >
              Copy demo link
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Yotoqxona" value={FLOORS.length} sub="floors on the register" />
        <Stat label="Xonalar" value={ROOMS.length} sub={`${occupiedRooms} occupied`} />
        <Stat label="Talabalar" value={USERS.length} sub={`${totalBeds - USERS.length} beds still free`} />
        <Stat
          label="Navbatchilik"
          value={`${completed.length}/${todaysDuties.length}`}
          sub={nextRoom ? `next: room ${nextRoom.number}` : 'ring complete today'}
        />
      </section>

      <div
        className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Warden sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-mint-600/35 bg-mint-400/12 text-mint-700'
                : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-graphite-950',
            )}
          >
            {t.label}
            <span className="ml-2 font-mono text-[10px] text-text-dim">{t.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'students' ? <StudentsTab /> : null}
        {tab === 'rooms' ? <RoomsTab onOpen={setRoomModal} ring={ring} /> : null}
        {tab === 'floors' ? <FloorsTab /> : null}
        {tab === 'duty' ? <DutiesTab /> : null}
        {tab === 'reports' ? <ReportsTab /> : null}
        {tab === 'stack' ? <StackTab /> : null}
      </div>

      <RoomModal room={roomModal} onClose={() => setRoomModal(null)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RoomsTab({ onOpen, ring }: { onOpen: (r: Room) => void; ring: Room[] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="hidden grid-cols-[5rem_1fr_6rem_6rem_5rem] gap-4 border-b border-line px-5 py-3 sm:grid">
        <span className="engrave">Xona</span>
        <span className="engrave">Talabalar</span>
        <span className="engrave">Sig&rsquo;im</span>
        <span className="engrave">Tomon</span>
        <span className="engrave">Navbatda</span>
      </div>
      <ul className="divide-y divide-line">
        {ROOMS.map((room) => {
          const residents = residentsOf(room.id);
          const inRing = ring.some((r) => r.id === room.id);
          const full = residents.length >= room.capacity;
          return (
            <li key={room.id}>
              <button
                onClick={() => onOpen(room)}
                className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-graphite-950/[0.04] sm:grid-cols-[5rem_1fr_6rem_6rem_5rem]"
              >
                <span className="plate px-2 py-0.5 text-[11px]">{room.number}</span>
                <span className="min-w-0 truncate text-sm text-text-mist">
                  {residents.map((r) => r.name.split(' ')[0]).join(', ') || '—'}
                </span>
                <span className="text-sm tabular-nums text-text-mist sm:hidden">
                  {residents.length}/{room.capacity}
                </span>
                <span className="hidden text-sm tabular-nums text-text-mist sm:block">
                  {residents.length}/{room.capacity}
                  {full ? <span className="ml-1.5 text-[11px] text-brass-600">full</span> : null}
                </span>
                <span className="hidden text-sm capitalize text-text-mist sm:block">{room.side}</span>
                <span className="hidden text-sm sm:block">
                  {inRing ? <span className="text-mint-600">yes</span> : <span className="text-text-dim">no</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function StudentsTab() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return USERS;
    return USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle) ||
        (ROOMS.find((r) => r.id === u.roomId)?.number ?? '').includes(needle),
    );
  }, [q]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or room"
          aria-label="Search residents"
          className="field max-w-xs"
        />
        <p className="font-mono text-xs tabular-nums text-text-dim">
          {filtered.length} of {USERS.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matches" body="Try a different name, email fragment, or room number." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => {
            const room = ROOMS.find((r) => r.id === u.roomId);
            return (
              <li key={u.id} className="panel-quiet flex items-center gap-3 p-3.5">
                <KeyTag initials={u.initials} tone={u.role === 'admin' ? 'brass' : 'default'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">{u.name}</p>
                  <p className="truncate font-mono text-[11px] text-text-dim">{u.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  {room ? <span className="plate px-1.5 py-0.5 text-[11px]">{room.number}</span> : null}
                  <p className="mt-1 text-[10px] capitalize text-text-dim">{u.role}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FloorsTab() {
  const liveFloorId = ROOMS[0]?.floorId ?? null;
  return (
    <section className="space-y-4">
      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[6rem_1fr_7rem_8rem] gap-4 border-b border-line px-5 py-3 sm:grid">
          <span className="engrave">Qavat</span>
          <span className="engrave">Nomi</span>
          <span className="engrave">Xonalar</span>
          <span className="engrave">Holati</span>
        </div>
        <ul className="divide-y divide-line">
          {FLOORS.map((f) => {
            const rooms = ROOMS.filter((r) => r.floorId === f.id);
            const isLive = f.id === liveFloorId;
            return (
              <li key={f.id} className="grid grid-cols-[4rem_1fr_auto] items-center gap-4 px-5 py-3.5 sm:grid-cols-[6rem_1fr_7rem_8rem]">
                <span className="plate w-fit px-2 py-0.5 text-[11px]">{f.number}</span>
                <span className="min-w-0 truncate text-sm text-text-mist">{f.name}</span>
                <span className="text-sm tabular-nums text-text-mist">
                  {rooms.length || '—'}
                  {rooms.length ? (
                    <span className="text-text-dim">
                      {' '}
                      / {rooms.reduce((n, r) => n + r.capacity, 0)} beds
                    </span>
                  ) : null}
                </span>
                <span className="justify-self-end text-xs sm:justify-self-auto">
                  {isLive ? (
                    <span className="text-mint-700">live in demo</span>
                  ) : rooms.length ? (
                    <span className="text-text-dim">register only</span>
                  ) : (
                    <span className="text-text-dim">no rooms yet</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs leading-relaxed text-text-dim">
        Only floor {FLOORS.find((f) => f.id === liveFloorId)?.number ?? 2} carries rooms and residents
        in this demo. The other floors exist so the register has the right shape from day one.
      </p>
    </section>
  );
}

function DutiesTab() {
  const duties = useDormStore((s) => s.duties);
  const sorted = [...duties].sort((a, b) => b.date.localeCompare(a.date) || a.roomId.localeCompare(b.roomId));
  return (
    <section className="panel overflow-hidden">
      <ul className="divide-y divide-line">
        {sorted.map((d) => {
          const room = ROOMS.find((r) => r.id === d.roomId);
          const colour =
            d.status === 'completed'
              ? ROOM_VISUALS.ready.glow
              : d.status === 'pending'
                ? ROOM_VISUALS.neutral.glow
                : ROOM_VISUALS.duty_today.glow;
          return (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <span className="size-2 shrink-0 rounded-full" style={{ background: colour }} />
              <span className="plate px-2 py-0.5 text-[11px]">{room?.number ?? '—'}</span>
              <span className="font-mono text-xs tabular-nums text-text-mist">{formatShortDate(d.date)}</span>
              <span className="text-xs capitalize text-text-mist">{d.status.replace('_', ' ')}</span>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-text-dim">
                {d.completedAt ? `closed ${formatClock(d.completedAt)}` : `${d.windowStart}–${d.windowEnd}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReportsTab() {
  const reports = useDormStore((s) => s.reports);
  const duties = useDormStore((s) => s.duties);

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports filed"
        body="Close a duty with a photo and the report lands here, stamped with the room and the time."
        action={
          <ButtonLink to="/duty" variant="ghost" size="sm">
            Go to duty
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((rep) => {
        const duty = duties.find((d) => d.id === rep.dutyId);
        const room = ROOMS.find((r) => r.id === duty?.roomId);
        return (
          <li key={rep.id} className="panel overflow-hidden">
            <img
              src={rep.photoUrl}
              alt={`Report for room ${room?.number ?? ''}`}
              loading="lazy"
              className="h-44 w-full object-cover"
            />
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="plate px-1.5 py-0.5 text-[11px]">{room?.number ?? '—'}</span>
                <span className="font-mono text-[11px] tabular-nums text-text-dim">
                  {formatShortDate(duty?.date ?? '')} · {formatClock(rep.createdAt)}
                </span>
              </div>
              {rep.note ? <p className="mt-2 text-xs text-text-mist text-pretty">{rep.note}</p> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StackTab() {
  const rows: { icon: typeof Database; label: string; value: string; note: string }[] = [
    {
      icon: Database,
      label: 'Data',
      value: 'Mock dataset + localStorage',
      note: '24 residents, 10 rooms, 3 floors and 8 duties seeded in src/data/mock.ts',
    },
    {
      icon: HardDrive,
      label: 'Photos',
      value: 'Browser data URLs',
      note: 'Resized to 1280px JPEG client-side. Swap for S3 or Supabase by replacing the upload in src/lib/image.ts',
    },
    {
      icon: ShieldCheck,
      label: 'Auth',
      value: 'Demo session',
      note: 'src/store/authStore.ts returns a typed User — replace signIn with a real provider',
    },
    {
      icon: Users,
      label: 'Deployment',
      value: 'GitHub Pages',
      note: 'HashRouter plus a relative base, so the build runs from any repository sub-path',
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value, note }) => (
        <div key={label} className="panel-quiet p-5">
          <div className="flex items-center gap-2.5">
            <Icon className="size-4 text-brass-600" strokeWidth={1.6} />
            <p className="engrave">{label}</p>
          </div>
          <p className="mt-3 font-display text-base font-semibold tracking-tight text-text">{value}</p>
          <p className="mt-2 text-xs leading-relaxed text-text-mist text-pretty">{note}</p>
        </div>
      ))}
      <div className="panel-quiet p-5 sm:col-span-2">
        <SectionTitle>Planned backend</SectionTitle>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-ink-850 p-4 font-mono text-xs leading-relaxed text-text-mist">
{`Frontend (this app)
      ↓  REST /api
Backend   auth · rooms · duties · reports
      ↓
Database Postgres
      ↓
Storage  S3 / Supabase bucket

The MVP runs the first layer only.`}
        </pre>
        <Link to="/login" className="link-underline mt-4 inline-block text-xs text-text-mist hover:text-text">
          Back to the demo sign-in
        </Link>
      </div>
    </section>
  );
}

function RoomModal({ room, onClose }: { room: Room | null; onClose: () => void }) {
  if (!room) return null;
  const residents = residentsOf(room.id);
  return (
    <Modal open={Boolean(room)} onClose={onClose} title={`Room ${room.number}`}>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="engrave">Floor</dt>
          <dd className="mt-1 text-sm text-text">Floor 2</dd>
        </div>
        <div>
          <dt className="engrave">Side</dt>
          <dd className="mt-1 text-sm capitalize text-text">{room.side}</dd>
        </div>
        <div>
          <dt className="engrave">Capacity</dt>
          <dd className="mt-1 text-sm tabular-nums text-text">{room.capacity}</dd>
        </div>
        <div>
          <dt className="engrave">Occupancy</dt>
          <dd className="mt-1 text-sm tabular-nums text-text">{residents.length}</dd>
        </div>
      </dl>
      <p className="engrave mt-6">Residents</p>
      <ul className="mt-3 space-y-2">
        {residents.map((r) => (
          <li key={r.id} className="flex items-center gap-3">
            <KeyTag initials={r.initials} />
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{r.name}</p>
              <p className="truncate font-mono text-[11px] text-text-dim">{r.email}</p>
            </div>
          </li>
        ))}
        {residents.length === 0 ? <li className="text-sm text-text-mist">No residents assigned.</li> : null}
      </ul>
      <ButtonLink to={`/room/${room.id}`} variant="ghost" className="mt-6 w-full" onClick={onClose}>
        Open room page
      </ButtonLink>
    </Modal>
  );
}
