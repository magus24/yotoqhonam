import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, Circle, Play } from 'lucide-react';
import { getNextDutyRoom, ROOM_VISUALS } from '../data/dutyQueue';
import { useDormStore } from '../store/dormStore';
import { useAllRooms, useDutyRing, useResidents } from '../store/useRegistry';
import { useReducedMotion } from '../hooks/useMedia';
import { Button, ButtonLink } from '../components/ui/Button';
import { DutyStamp, DutyTimeline } from '../components/duty/DutyTimeline';
import { EmptyState, ProgressBar } from '../components/ui/Primitives';
import { toast } from '../components/ui/Toast';
import { cn, formatShortDate, todayISO } from '../lib/utils';

export default function DutyPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const duties = useDormStore((s) => s.duties);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const setActiveDuty = useDormStore((s) => s.setActiveDuty);
  const startDuty = useDormStore((s) => s.startDuty);
  const toggleChecklistItem = useDormStore((s) => s.toggleChecklistItem);

  const activeDuty = useMemo(() => duties.find((d) => d.id === activeDutyId) ?? null, [duties, activeDutyId]);
  const ring = useDutyRing();
  const allRooms = useAllRooms();

  const room = allRooms.find((r) => r.id === activeDuty?.roomId) ?? null;
  const residents = useResidents(room?.id ?? null);
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const otherDuties = duties
    .filter((d) => d.date === todayISO() && d.id !== activeDuty?.id)
    .sort((a, b) => a.roomId.localeCompare(b.roomId));

  if (!activeDuty || !room) {
    return (
      <div className="space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-text-mist hover:text-text">
          <ArrowLeft className="size-3.5" strokeWidth={1.7} />
          Overview
        </Link>
        <EmptyState as="h1"
          title="No duty is open"
          body="Every room in tonight’s ring has closed. Open a room from the floor plan to see its record."
          action={
            <ButtonLink to="/floor" variant="ghost" size="sm">
              Go to the floor plan
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const done = activeDuty.completedItems.length;
  const total = activeDuty.checklist.length;
  const allDone = done === total;
  const isPending = activeDuty.status === 'pending';
  const isCompleted = activeDuty.status === 'completed';
  const palette = ROOM_VISUALS.duty_today;

  const handleStart = () => {
    startDuty(activeDuty.id);
    toast.info('Duty started', `Room ${room.number} · ${activeDuty.windowStart}–${activeDuty.windowEnd}`);
  };

  const handleToggle = (itemId: string, label: string) => {
    const wasDone = activeDuty.completedItems.includes(itemId);
    toggleChecklistItem(activeDuty.id, itemId);
    if (!wasDone) toast.success('Checked', label);
  };

  return (
    <div className="space-y-8">
      <Link to={`/room/${room.id}`} className="inline-flex items-center gap-2 text-xs text-text-mist transition-colors hover:text-text">
        <ArrowLeft className="size-3.5" strokeWidth={1.7} />
        Room {room.number}
      </Link>

      <header>
        <p className="engrave">Today’s duty</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <motion.span
            initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="plate px-5 py-2.5 text-3xl tracking-[0.16em]"
            style={{ borderColor: palette.tint, background: palette.tint, color: palette.text }}
          >
            {room.number}
          </motion.span>
          <div>
            <h1 className="font-display text-display-sm font-semibold leading-[1] text-text">
              {activeDuty.windowStart} — {activeDuty.windowEnd}
            </h1>
            <p className="mt-2 text-sm text-text-mist">
              {residents.length} residents · {room.side} side of the corridor
            </p>
          </div>
        </div>
        <div className="mt-3">
          <DutyStamp duty={activeDuty} />
        </div>
      </header>

      <section className="panel p-5 sm:p-6">
        <DutyTimeline
          status={activeDuty.status}
          startedAt={activeDuty.startedAt}
          completedAt={activeDuty.completedAt}
        />
      </section>

      {/* ---------------------------------------------------------------- */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <section className="panel p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-text">Checklist</h2>
            <p className="font-mono text-xs tabular-nums text-text-dim">
              {done}/{total}
            </p>
          </div>
          <ProgressBar value={(done / Math.max(1, total)) * 100} className="mt-3" />

          <ul className="mt-5 space-y-2">
            {activeDuty.checklist.map((item) => {
              const checked = activeDuty.completedItems.includes(item.id);
              const locked = isCompleted;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => !locked && handleToggle(item.id, item.label)}
                    disabled={locked}
                    aria-pressed={checked}
                    className={cn(
                      'group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-300',
                      checked
                        ? 'border-mint-400/30 bg-mint-400/[0.08]'
                        : 'border-graphite-950/[0.10] hover:border-graphite-950/20 hover:bg-graphite-950/[0.05]',
                      locked && 'cursor-default opacity-70',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-lg border transition-colors duration-300',
                        checked ? 'border-mint-400 bg-mint-400 text-ink-950' : 'border-graphite-950/20 text-transparent',
                      )}
                    >
                      {checked ? <Check className="size-3.5" strokeWidth={3} /> : <Circle className="size-3" strokeWidth={2} />}
                    </span>
                    <span className={cn('text-sm', checked ? 'text-text' : 'text-text-mist')}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-graphite-950/[0.09] pt-5">
            {isPending ? (
              <Button onClick={handleStart} icon={<Play className="size-4" />}>
                Start duty
              </Button>
            ) : null}

            {isCompleted ? (
              <ButtonLink to="/duty/report" icon={<Camera className="size-4" />}>
                View report
              </ButtonLink>
            ) : allDone ? (
              <Button onClick={() => navigate('/duty/report')} icon={<Camera className="size-4" />}>
                Add photo &amp; complete
              </Button>
            ) : (
              <Button variant="ghost" disabled icon={<Camera className="size-4" />}>
                Photo report
              </Button>
            )}

            {isPending ? (
              <p className="flex items-center gap-2 self-center text-xs text-text-dim">
                Start the duty before you can tick anything off.
              </p>
            ) : !allDone && !isCompleted ? (
              <p className="flex items-center gap-2 self-center text-xs text-text-dim">
                {total - done} check{total - done === 1 ? '' : 's'} left before the photo.
              </p>
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="engrave">Handover</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="plate px-3 py-1.5" style={{ borderColor: palette.tint, color: palette.text }}>
                {room.number}
              </span>
              <svg viewBox="0 0 40 12" className="h-3 flex-1 text-text-dim" aria-hidden>
                <path
                  d="M0 6h30M26 2l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray={isCompleted ? '0' : '3 3'}
                />
              </svg>
              <span className={cn('plate px-3 py-1.5', isCompleted && 'border-mint-400/40 text-mint-600')}>
                {nextRoom?.number ?? '—'}
              </span>
            </div>
            <p className="mt-3.5 text-xs leading-relaxed text-text-dim text-pretty">
              {isCompleted
                ? `The ring has moved to room ${nextRoom?.number ?? '—'}. Your report is filed.`
                : `Room ${nextRoom?.number ?? '—'} receives the duty as soon as you complete this one.`}
            </p>
          </div>

          {otherDuties.length ? (
            <div className="panel p-5">
              <p className="engrave">Also on duty tonight</p>
              <ul className="mt-3.5 space-y-1.5">
                {otherDuties.map((d) => {
                  const r = allRooms.find((x) => x.id === d.roomId);
                  if (!r) return null;
                  return (
                    <li key={d.id}>
                      <button
                        onClick={() => setActiveDuty(d.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-graphite-950/[0.06]',
                        )}
                      >
                        <span className="plate px-1.5 py-0.5 text-[11px]">{r.number}</span>
                        <span className="text-xs capitalize text-text-mist">{d.status.replace('_', ' ')}</span>
                        <span className="ml-auto font-mono text-[11px] text-text-dim">
                          {formatShortDate(d.date)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="panel-quiet p-5">
            <p className="text-xs leading-relaxed text-text-dim text-pretty">
              Everything on this page is stored in your browser. Close the tab mid-duty and it will be
              waiting for you when you come back.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
