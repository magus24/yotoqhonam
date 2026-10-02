import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, Camera, ChevronRight, CreditCard, RotateCcw, Users } from 'lucide-react';
import { getNextDutyRoom, resolveRoomState, ROOM_STATE_ORDER, ROOM_VISUALS } from '../data/dutyQueue';
import { isResidenceStaff, roomsOfFloor } from '../data/registry';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import {
  useAllRooms,
  useDormitory,
  useDutyRing,
  useFloorResidents,
  useFloor,
  useFloors,
  useOccupancy,
  usePayments,
  usePaymentSummaries,
  usePlacements,
  useResidents,
  useRoom,
  useRoomOccupant,
  useStudents,
  useUserBed,
  useUserRoom,
} from '../store/useRegistry';
import { useReducedMotion } from '../hooks/useMedia';
import { DeferredFloorCanvas } from '../components/layout/AppShell';
import { Button, ButtonLink } from '../components/ui/Button';
import {
  EmptyState,
  KeyTag,
  ProgressBar,
  SectionTitle,
} from '../components/ui/Primitives';
import { RotationTicker } from '../components/route/RotationDiagram';
import { DutyTimeline } from '../components/duty/DutyTimeline';
import { cn, firstName, formatClock, formatLongDate, greeting, todayISO } from '../lib/utils';
import type { Duty, Room } from '../data/types';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const reduced = useReducedMotion();

  const duties = useDormStore((s) => s.duties);
  const reports = useDormStore((s) => s.reports);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const resetDemo = useDormStore((s) => s.resetDemo);

  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const activeDuty = useMemo(() => duties.find((d) => d.id === activeDutyId) ?? null, [duties, activeDutyId]);

  const dormitory = useDormitory();
  const floors = useFloors();
  const rooms = useAllRooms();
  const ring = useDutyRing();
  const occupancy = useOccupancy();
  const ownRoom = useUserRoom(user);
  const ownBed = useUserBed(user);
  const ownResidents = useResidents(ownRoom?.id ?? null);
  const students = useStudents();
  const payments = usePayments();
  const summaries = usePaymentSummaries(students);

  // Staff have no bed of their own — they answer for the whole residence, so
  // every "your room" affordance below has to give way to the estate view.
  const staff = isResidenceStaff(user);

  const activeRoom = useRoom(activeDuty?.roomId ?? null);
  const nextRoom = getNextDutyRoom(activeRoom?.id ?? '', ring);

  const totalResidents = occupancy.occupied;

  // A resident sees their floor; staff can switch between any of the 4 floors
  const ownFloor =
    floors.find((f) => f.id === selectedFloorId) ??
    (staff ? floors[0] : (floors.find((f) => f.id === ownRoom?.floorId) ?? floors[0]));
  const floorNo = ownFloor?.number ?? 1;

  const floorResidents = useFloorResidents(ownFloor?.id);
  const floorRooms = useMemo(() => (ownFloor ? roomsOfFloor(rooms, ownFloor.id) : rooms), [rooms, ownFloor]);
  const placements = usePlacements();

  const paidCount = useMemo(() => Array.from(summaries.values()).filter((s) => s.state === 'current').length, [summaries]);
  const dueCount = useMemo(() => Array.from(summaries.values()).filter((s) => s.state === 'due').length, [summaries]);

  const occupiedRooms = occupancy.occupiedRooms;
  const totalBeds = occupancy.capacity;
  const bedsFree = occupancy.free;

  const completedToday = duties.filter((d) => d.date === todayISO() && d.status === 'completed').length;
  const progress = duties.length
    ? (duties.filter((d) => d.date === todayISO()).filter((d) => d.status === 'completed').length /
        Math.max(1, ring.length)) * 100
    : 0;

  const nextTarget = activeDuty?.status === 'completed' || reports.some((r) => r.dutyId === activeDuty?.id)
    ? '/duty/report'
    : '/duty';

  if (!user) return null;

  const HIERARCHY = [
    { label: 'Yotoqxona', value: dormitory?.name ?? '-', to: '/admin' },
    { label: 'Qavat', value: staff ? `${floorNo}-qavat` : `Floor ${floorNo}`, to: `/floor?floor=${floorNo}` },
    staff
      ? { label: 'Boshqaruv', value: 'Barcha xonalar (40 ta)', to: '/admin' }
      : {
          label: 'Xona',
          value: ownRoom ? `Room ${ownRoom.number}` : 'Unassigned',
          to: ownRoom ? `/room/${ownRoom.id}` : null,
        },
    staff
      ? { label: 'Rol', value: `${user.name} (Bosh administrator)`, to: '/admin' }
      : { label: 'Talaba', value: firstName(user.name), to: null },
  ];

  return (
    <div className="space-y-10">
      {/* ---------------------------------------------------------------- */}
      {/* Where you are in the structure: Yotoqxona -> Qavat -> Xona -> Talaba */}
      {/* ---------------------------------------------------------------- */}
      <header>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="engrave">{formatLongDate()}</p>
            <h1 className="mt-2.5 font-display text-display-sm font-semibold leading-[1] text-text">
              {greeting()}, <span className="text-mint-700">{firstName(user.name)}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDemo}
              icon={<RotateCcw className="size-3.5" strokeWidth={1.7} />}
            >
              Reset demo
            </Button>
          </div>
        </div>

        <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {HIERARCHY.map((node, i) => (
            <li key={node.label} className="flex items-center gap-2">
              {node.to ? (
                <Link
                  to={node.to}
                  className="group flex items-baseline gap-2 rounded-lg border border-line-strong bg-ink-900 px-2.5 py-1.5 transition-colors hover:border-mint-600/40 hover:bg-ink-850"
                >
                  <span className="text-[10px] font-medium text-text-dim">{node.label}</span>
                  <span className="font-medium text-graphite-950">{node.value}</span>
                </Link>
              ) : (
                <span className="flex items-baseline gap-2 rounded-lg border border-mint-600/30 bg-mint-400/12 px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-mint-700">{node.label}</span>
                  <span className="font-medium text-graphite-950">{node.value}</span>
                </span>
              )}
              {i < HIERARCHY.length - 1 ? (
                <span aria-hidden className="text-graphite-950/45">
                  /
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Floor selection switcher for exploring all 4 floors              */}
      {/* ---------------------------------------------------------------- */}
      {floors.length > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-graphite-950/10 bg-graphite-950/[0.03] p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text">Qavatlar:</span>
            <span className="text-xs text-text-dim">Bino bo‘ylab qavatni tanlang</span>
          </div>
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Floor selection">
            {floors.map((fl) => (
              <button
                key={fl.id}
                onClick={() => {
                  setSelectedFloorId(fl.id);
                  setSelectedRoomId(null);
                }}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  fl.id === ownFloor?.id
                    ? 'border-mint-600/40 bg-mint-400/20 text-mint-700 font-semibold shadow-xs'
                    : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text'
                }`}
              >
                {fl.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Staff Payment Overview card                                       */}
      {/* ---------------------------------------------------------------- */}
      {staff ? (
        <section aria-label="To‘lovlar monitoringi" className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle hint={<CreditCard className="size-4 text-text-dim" strokeWidth={1.6} />}>
              To‘lovlar monitoringi (Barcha 4 qavat)
            </SectionTitle>
            <ButtonLink to="/admin?tab=payments" size="sm">
              Barcha to‘lovlarni ko‘rish va kiritish
              <ChevronRight className="size-3.5" />
            </ButtonLink>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-graphite-950/10 bg-graphite-950/[0.03] p-3.5">
              <dt className="engrave">Jami talabalar</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-text">{students.length}</dd>
              <p className="mt-0.5 text-[11px] text-text-dim">4 ta qavat bo‘yicha</p>
            </div>
            <div className="rounded-xl border border-mint-600/25 bg-mint-400/10 p-3.5">
              <dt className="engrave text-mint-700">To‘liq to‘laganlar</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-mint-700">{paidCount}</dd>
              <p className="mt-0.5 text-[11px] text-mint-700">Qarzsiz talabalar</p>
            </div>
            <div className="rounded-xl border border-brass-400/30 bg-brass-400/10 p-3.5">
              <dt className="engrave text-brass-700">Qarzdorlar</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-brass-700">{dueCount}</dd>
              <p className="mt-0.5 text-[11px] text-brass-700">To‘lovi kechikkan</p>
            </div>
            <div className="rounded-xl border border-graphite-950/10 bg-graphite-950/[0.03] p-3.5">
              <dt className="engrave">To‘lov yozuvlari</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-text">{payments.length}</dd>
              <p className="mt-0.5 text-[11px] text-text-dim">Kvitansiyalar soni</p>
            </div>
          </dl>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Registration and occupancy come before duty                       */}
      {/* ---------------------------------------------------------------- */}
      <section aria-label="Residence register" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="panel min-w-0 p-5 sm:p-6">
          <SectionTitle hint={<span className="font-mono text-xs">Floor {floorNo}</span>}>
            Residence register
          </SectionTitle>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            <Figure label="Students registered" value={totalResidents} sub={`${students.length} names on file`} />
            <Figure label="Rooms" value={rooms.length} sub={`${occupiedRooms} occupied`} />
            <Figure label="Beds free" value={bedsFree} sub={`of ${totalBeds} in the residence`} />
            <Figure
              label={staff ? 'Boshqaruv hududi' : 'Your room'}
              value={staff ? 'Barcha xonalar' : ownRoom ? ownRoom.number : '—'}
              sub={
                staff
                  ? `${floors.length} ta qavat · ${rooms.length} ta xona · 100% nazorat`
                  : ownRoom
                    ? ownBed
                      ? `joy ${ownBed.number} · ${ownRoom.capacity - ownResidents.length} bo‘sh`
                      : `${ownResidents.length} of ${ownRoom.capacity} filled`
                    : 'unassigned'
              }
            />
          </dl>
        </div>

        <div className="panel-quiet flex min-w-0 flex-col justify-between p-5 sm:p-6">
          <SectionTitle hint={<Users className="size-4 text-text-dim" strokeWidth={1.6} />}>
            Residents on floor {floorNo}
          </SectionTitle>
          <ul className="mt-5 space-y-2">
            {floorResidents.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <KeyTag initials={r.initials} tone={r.userId === user.id ? 'brass' : 'default'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">
                    {r.name}
                    {r.userId === user.id ? (
                      <span className="ml-2 text-[11px] font-medium text-mint-700">you</span>
                    ) : null}
                  </p>
                  <p className="truncate font-mono text-[11px] text-text-dim">
                    {placements.get(r.id)
                      ? `${placements.get(r.id)?.room?.number ?? '—'} · ${placements.get(r.id)?.bed.number}-joy`
                      : 'joysiz'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {ownRoom ? (
            <ButtonLink to={`/room/${ownRoom.id}`} variant="ghost" size="sm" className="mt-5 w-full">
              Open room {ownRoom.number}
              <ChevronRight className="size-3.5" />
            </ButtonLink>
          ) : staff ? (
            <ButtonLink to="/admin" variant="ghost" size="sm" className="mt-5 w-full">
              Open the warden console
              <ChevronRight className="size-3.5" />
            </ButtonLink>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Duty card — the one thing that matters right now                  */}
      {/* ---------------------------------------------------------------- */}
      {activeDuty && activeRoom ? (
        <DutyCard duty={activeDuty} room={activeRoom} nextRoom={nextRoom} to={nextTarget} />
      ) : (
        <EmptyState as="h1"
          title="No duty is open right now"
          body="Every room in tonight's ring has closed its duty. The warden will open the next one."
          action={
            <ButtonLink to="/floor" variant="ghost" size="sm">
              Look at the floor
            </ButtonLink>
          }
        />
      )}

      {/* ---------------------------------------------------------------- */}
      <section className="space-y-4">
        <SectionTitle hint={<span className="font-mono tabular-nums">{floorRooms.length} rooms</span>}>
          Floor {floorNo} plan
        </SectionTitle>
        <FloorStage rooms={floorRooms} selectedRoomId={selectedRoomId} onSelect={setSelectedRoomId} reducedMotion={reduced} />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="panel min-w-0 p-5 sm:p-6">
          <SectionTitle
            hint={
              <span className="font-mono text-xs">
                {completedToday}/{ring.length} closed
              </span>
            }
          >
            Tonight&rsquo;s rotation
          </SectionTitle>
          <RotationTicker rooms={ring} activeRoomId={activeRoom?.id ?? null} className="mt-5" />
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs text-text-dim">Ring progress</p>
              <p className="font-mono text-xs tabular-nums text-text-mist">{Math.round(progress)}%</p>
            </div>
            <ProgressBar value={progress} className="mt-2" />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-dim text-pretty">
            Room {activeRoom?.number ?? '—'} closes the duty, then passes the ring to{' '}
            {nextRoom?.number ?? '—'}. The order comes from a single list, so changing the rota needs
            no code.
          </p>
        </div>

        <div className="panel min-w-0 p-5 sm:p-6">
          <SectionTitle hint={<CalendarClock className="size-4 text-text-dim" strokeWidth={1.6} />}>
            Reading the plan
          </SectionTitle>
          <ul className="mt-5 space-y-3">
            {ROOM_STATE_ORDER.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: ROOM_VISUALS[s].glow }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-graphite-950">{ROOM_VISUALS[s].label}</p>
                  <p className="text-xs leading-relaxed text-text-dim">{ROOM_VISUALS[s].description}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-text-dim">
            Colours come from one map, so the 3D plan, the legend and the room page can never
            disagree.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="panel p-5 sm:p-6">
        <SectionTitle hint={<Link to="/admin" className="link-underline text-xs text-text-mist hover:text-text">Admin</Link>}>
          Recent reports
        </SectionTitle>
        {reports.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No reports yet"
              body="Photo reports appear here the moment a duty is closed, with the time it was taken."
              action={
                <ButtonLink to="/duty" variant="ghost" size="sm" icon={<Camera className="size-3.5" strokeWidth={1.7} />}>
                  Go to duty
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {reports.slice(0, 6).map((rep) => {
              const duty = duties.find((d) => d.id === rep.dutyId);
              const room = rooms.find((r) => r.id === duty?.roomId);
              return (
                <li key={rep.id} className="panel-quiet overflow-hidden">
                  <img
                    src={rep.photoUrl}
                    alt={`Duty report for room ${room?.number ?? ''}`}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                  <div className="flex items-center gap-2 px-3.5 py-3">
                    <span className="plate px-1.5 py-0.5 text-[11px]">{room?.number}</span>
                    <p className="text-[11px] text-text-dim">{formatClock(rep.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* A single register number                                                     */
/* -------------------------------------------------------------------------- */

function Figure({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-dim">{label}</dt>
      <dd className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-graphite-950">
        {value}
      </dd>
      <p className="mt-1 truncate text-[11px] text-text-dim">{sub}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The duty card                                                              */
/* -------------------------------------------------------------------------- */

function DutyCard({
  duty,
  room,
  nextRoom,
  to,
}: {
  duty: Duty;
  room: Room;
  nextRoom: Room | null;
  to: string;
}) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const residents = useRoomOccupant(room.id);
  const floor = useFloor(room.floorId);
  const isOpen = duty.status !== 'completed';
  const done = duty.completedItems.length;
  const pct = (done / Math.max(1, duty.checklist.length)) * 100;
  const state = ROOM_VISUALS.duty_today;

  return (
    <motion.section
      initial={reduced ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-brass-400/22 bg-gradient-to-br from-brass-400/[0.1] via-ink-850/70 to-ink-850/70 p-5 shadow-card backdrop-blur-xl sm:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-brass-400/12 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 blueprint opacity-[0.18]" />

      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="engrave" style={{ color: state.text }}>
            Today’s duty
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span
              className="plate px-4 py-2 text-xl tracking-[0.16em]"
              style={{ borderColor: state.tint, color: state.text, background: state.tint }}
            >
              {room.number}
            </span>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-text">
                {duty.windowStart} — {duty.windowEnd}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-mist">
                <CalendarClock className="size-3.5" strokeWidth={1.6} />
                {residents} residents{floor ? ` · floor ${floor.number}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.14em]"
            style={{
              borderColor: state.tint,
              background: state.tint,
              color: state.text,
            }}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full" style={{ background: state.glow }} />
              <span className="relative size-1.5 rounded-full" style={{ background: state.glow }} />
            </span>
            {isOpen ? (duty.status === 'pending' ? 'Pending' : 'In progress') : 'Handed over'}
          </span>
          <span className="font-mono text-xs tabular-nums text-text-dim">
            {done}/{duty.checklist.length} checks
          </span>
        </div>
      </div>

      <div className="relative mt-6">
        <DutyTimeline status={duty.status} startedAt={duty.startedAt} completedAt={duty.completedAt} compact />
        <ProgressBar value={pct} className="mt-5" />
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => navigate(to)} icon={<ArrowRight className="size-4" />}>
          {isOpen ? 'Open duty' : 'View handover'}
        </Button>
        <ButtonLink to={`/room/${room.id}`} variant="ghost">
          Room {room.number} details
        </ButtonLink>
        {nextRoom ? (
          <p className="ml-auto flex items-center gap-2 text-xs text-text-mist">
            Hands over to
            <span className="plate px-2 py-0.5 text-[11px] text-mint-600">{nextRoom.number}</span>
          </p>
        ) : null}
      </div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Embedded floor plan                                                        */
/* -------------------------------------------------------------------------- */

function FloorStage({
  rooms,
  selectedRoomId,
  onSelect,
  reducedMotion,
}: {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (id: string | null) => void;
  reducedMotion: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const duties = useDormStore((s) => s.duties);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const ring = useDutyRing();
  const ownRoom = useUserRoom(user);
  const activeDuty = duties.find((d) => d.id === activeDutyId) ?? null;
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const selected = useRoom(selectedRoomId);
  const selectedOccupants = useRoomOccupant(selected?.id ?? null);

  const state = selected
    ? resolveRoomState(selected.id, {
        currentDutyRoomId: activeDuty?.roomId ?? null,
        nextDutyRoomId: nextRoom?.id ?? null,
        ownRoomId: ownRoom?.id ?? null,
        dutyStatus: activeDuty?.status ?? null,
      })
    : 'neutral';

  return (
    <div className="panel relative overflow-hidden p-0">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative h-[22rem] sm:h-[26rem] lg:h-[30rem]">
        <DeferredFloorCanvas
          rooms={rooms}
          queue={ring.map((r) => r.id)}
          activeRoomId={activeDuty?.roomId ?? null}
          nextRoomId={nextRoom?.id ?? null}
          ownRoomId={ownRoom?.id ?? null}
          dutyStatus={activeDuty?.status ?? null}
          selectedRoomId={selectedRoomId}
          onSelect={onSelect}
          mode="explore"
          reducedMotion={reducedMotion}
        />
      </div>

      <div className={cn('relative flex flex-wrap items-center gap-3 border-t border-graphite-950/[0.09] px-4 py-3.5 sm:px-5')}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(['duty_today', 'next_duty', 'ready', 'neutral'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] text-text-mist">
              <span className="size-1.5 rounded-full" style={{ background: ROOM_VISUALS[s].glow }} />
              {ROOM_VISUALS[s].label}
            </span>
          ))}
        </div>
        <p className="ml-auto hidden text-[11px] text-text-dim sm:block">Drag to orbit · tap a room to focus</p>
        {selected ? (
          <ButtonLink to={`/room/${selected.id}`} size="sm" variant="ghost" className="sm:ml-auto">
            Room {selected.number}
            <ChevronRight className="size-3.5" />
          </ButtonLink>
        ) : null}
      </div>

      {selected ? (
        <p className="border-t border-graphite-950/[0.09] px-4 py-2.5 text-[11px] text-text-dim sm:px-5">
          {selectedOccupants} residents ·{' '}
          <span style={{ color: ROOM_VISUALS[state].text }}>{ROOM_VISUALS[state].label}</span>
        </p>
      ) : null}
    </div>
  );
}
