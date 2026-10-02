import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, History, Users } from 'lucide-react';
import { getNextDutyRoom, resolveRoomState, ROOM_VISUALS } from '../data/dutyQueue';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import { useDutyRing, useFloor, useResidents, useRoom, useRoomBeds, useRoomOccupant, useUserRoom } from '../store/useRegistry';
import { useReducedMotion } from '../hooks/useMedia';
import { Button, ButtonLink } from '../components/ui/Button';
import { DutyStamp, DutyTimeline } from '../components/duty/DutyTimeline';
import { EmptyState, KeyTag, ProgressBar, RoomStateBadge, SectionTitle } from '../components/ui/Primitives';
import { cn, formatClock, formatShortDate, todayISO } from '../lib/utils';

export default function RoomPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const user = useAuthStore((s) => s.user);
  const duties = useDormStore((s) => s.duties);
  const reports = useDormStore((s) => s.reports);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const startDuty = useDormStore((s) => s.startDuty);
  const setActiveDuty = useDormStore((s) => s.setActiveDuty);

  const room = useRoom(id);
  const floor = useFloor(room?.floorId);
  const residents = useResidents(id);
  const beds = useRoomBeds(id);
  const ownRoom = useUserRoom(user);

  const activeDuty = useMemo(() => duties.find((d) => d.id === activeDutyId) ?? null, [duties, activeDutyId]);
  const ring = useDutyRing();
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const nextOccupants = useRoomOccupant(nextRoom?.id ?? null);

  const history = useMemo(
    () =>
      duties
        .filter((d) => d.roomId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [duties, id],
  );
  const roomReports = useMemo(() => {
    const dutyIds = new Set(duties.filter((d) => d.roomId === id).map((d) => d.id));
    return reports.filter((r) => dutyIds.has(r.dutyId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [duties, reports, id]);

  if (!room) {
    return (
      <EmptyState as="h1"
        title="That room is not on this floor"
        body="The address may be from another floor, or the room was reassigned."
        action={
          <ButtonLink to="/floor" variant="ghost" size="sm">
            Back to the floor
          </ButtonLink>
        }
      />
    );
  }

  const todayDuty = duties.find((d) => d.roomId === room.id && d.date === todayISO()) ?? null;
  const isDutyRoom = room.id === activeDuty?.roomId;
  const isOwn = ownRoom?.id === room.id;

  const state = resolveRoomState(room.id, {
    currentDutyRoomId: activeDuty?.roomId ?? null,
    nextDutyRoomId: nextRoom?.id ?? null,
    ownRoomId: ownRoom?.id ?? null,
    dutyStatus: activeDuty?.status ?? null,
  });

  const beginDuty = () => {
    if (!todayDuty) return;
    if (!isDutyRoom) setActiveDuty(todayDuty.id);
    startDuty(todayDuty.id);
    navigate('/duty');
  };

  return (
    <div className="space-y-8">
      <Link to={`/floor?floor=${floor?.number ?? ''}`} className="inline-flex items-center gap-2 text-xs text-text-mist transition-colors hover:text-text">
        <ArrowLeft className="size-3.5" strokeWidth={1.7} />
        Floor {floor?.number ?? '—'} plan
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <motion.span
              initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="plate px-4 py-2 text-2xl tracking-[0.16em]"
              style={{
                borderColor: ROOM_VISUALS[state].tint,
                background: ROOM_VISUALS[state].tint,
                color: ROOM_VISUALS[state].text,
              }}
            >
              {room.number}
            </motion.span>
            <RoomStateBadge state={state} />
            {isOwn ? (
              <span className="text-2xs font-semibold uppercase tracking-[0.18em] text-brass-600">Your room</span>
            ) : null}
          </div>
          <h1 className="mt-4 font-display text-display-sm font-semibold leading-[1] text-text">
            Room {room.number}
          </h1>
          <p className="mt-2 text-sm text-text-mist">
            Floor {floor?.number ?? '—'} · {room.side} side of the corridor · capacity {room.capacity}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {todayDuty && isDutyRoom ? (
            todayDuty.status === 'completed' ? (
              <ButtonLink to="/duty/report" icon={<Camera className="size-4" />}>
                View report
              </ButtonLink>
            ) : (
              <Button onClick={beginDuty} icon={<ArrowRight className="size-4" />}>
                {todayDuty.status === 'pending' ? 'Start duty' : 'Continue duty'}
              </Button>
            )
          ) : todayDuty ? (
            <Button
              variant="ghost"
              onClick={() => {
                setActiveDuty(todayDuty.id);
                navigate('/duty');
              }}
            >
              Open today’s duty
            </Button>
          ) : (
            <Button variant="ghost" disabled>
              No duty today
            </Button>
          )}
          <ButtonLink to="/floor" variant="ghost" icon={<History className="size-4" />}>
            View floor
          </ButtonLink>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {todayDuty ? (
        <motion.section
          initial={reduced ? undefined : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="panel p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="engrave">Duty</p>
              <p className="mt-2 font-display text-xl font-semibold tracking-tight text-text">
                {todayDuty.date === todayISO() ? 'Today' : formatShortDate(todayDuty.date)} ·{' '}
                {todayDuty.windowStart}–{todayDuty.windowEnd}
              </p>
              <div className="mt-1.5">
                <DutyStamp duty={todayDuty} />
              </div>
            </div>
            <div className="text-right">
              <p className="engrave">Status</p>
              <p
                className="mt-2 font-display text-xl font-semibold capitalize tracking-tight"
                style={{ color: todayDuty.status === 'completed' ? ROOM_VISUALS.ready.text : ROOM_VISUALS.duty_today.text }}
              >
                {todayDuty.status.replace('_', ' ')}
              </p>
              <p className="mt-1 text-xs text-text-dim">
                {todayDuty.completedItems.length}/{todayDuty.checklist.length} checks done
              </p>
            </div>
          </div>

          <DutyTimeline
            status={todayDuty.status}
            startedAt={todayDuty.startedAt}
            completedAt={todayDuty.completedAt}
            className="mt-6"
          />
          <ProgressBar
            value={(todayDuty.completedItems.length / Math.max(1, todayDuty.checklist.length)) * 100}
            tone={todayDuty.status === 'completed' ? 'mint' : 'brass'}
            className="mt-5"
          />

          {nextRoom ? (
            <p className="mt-5 flex flex-wrap items-center gap-2 border-t border-graphite-950/[0.09] pt-4 text-xs text-text-mist">
              <span>Next in the ring</span>
              <span className="plate px-2 py-0.5 text-[11px] text-mint-600">{nextRoom.number}</span>
              <span className="text-text-dim">
                · {nextOccupants} residents, {nextRoom.side} side
              </span>
            </p>
          ) : null}
        </motion.section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6">
          <SectionTitle hint={<Users className="size-4 text-text-dim" strokeWidth={1.6} />}>Residents</SectionTitle>
          <ul className="mt-5 space-y-2.5">
            {residents.length === 0 ? (
              <li className="text-sm text-text-mist">No residents linked to this room yet.</li>
            ) : (
              residents.map((r) => {
                const bed = beds.find((b) => b.studentId === r.id);
                const isMe = Boolean(user && r.userId === user.id);
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <KeyTag initials={r.initials} tone={isMe ? 'brass' : 'default'} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">
                        {r.name}
                        {isMe ? <span className="ml-2 text-[11px] text-brass-600">you</span> : null}
                      </p>
                      <p className="truncate font-mono text-[11px] text-text-dim">
                        {bed ? `${bed.number}-joy` : 'joy belgilanmagan'}
                        {r.faculty ? ` · ${r.faculty}` : ''}
                      </p>
                    </div>
                    {r.course ? (
                      <span className="ml-auto shrink-0 text-[11px] text-text-dim">{r.course}-kurs</span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
          <p className="mt-5 border-t border-graphite-950/[0.09] pt-3.5 text-xs text-text-dim">
            {residents.length} of {room.capacity} places filled
          </p>
        </section>

        <section className="panel p-5 sm:p-6">
          <SectionTitle>Reports</SectionTitle>
          {roomReports.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No photos yet"
                body="When this room closes a duty, the corridor photo is filed here with its timestamp."
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {roomReports.map((rep) => (
                <li key={rep.id} className="panel-quite flex items-center gap-3.5 p-3">
                  <img
                    src={rep.photoUrl}
                    alt={`Duty report for room ${room.number}`}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-mint-600">
                      <CheckCircle2 className="size-3.5" strokeWidth={2} />
                      Duty closed
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-text-dim">
                      {formatClock(rep.createdAt)}
                    </p>
                    {rep.note ? (
                      <p className="mt-1 truncate text-[11px] text-text-mist">{rep.note}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---------------------------------------------------------------- */}
      <section className="panel p-5 sm:p-6">
        <SectionTitle hint={<span className="font-mono text-xs text-text-dim">{history.length} entries</span>}>
          Duty history
        </SectionTitle>
        <ul className="mt-5 divide-y divide-line">
          {history.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  d.status === 'completed' ? 'bg-mint-400' : 'bg-brass-400',
                )}
              />
              <span className="font-mono text-sm tabular-nums text-text">{formatShortDate(d.date)}</span>
              <span className="text-xs capitalize text-text-mist">{d.status.replace('_', ' ')}</span>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-text-dim">
                {d.completedAt ? `closed ${formatClock(d.completedAt)}` : `${d.windowStart}–${d.windowEnd}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
