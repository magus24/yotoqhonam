import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, Check, ImageOff, RotateCcw, Trash2, Upload } from 'lucide-react';
import { ROOMS, residentsOf } from '../data/mock';
import { getNextDutyRoom, ROOM_VISUALS } from '../data/dutyQueue';
import { useDormStore } from '../store/dormStore';
import { compressImage, isImage, MAX_UPLOAD_BYTES } from '../lib/image';
import { useReducedMotion } from '../hooks/useMedia';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState, ProgressBar } from '../components/ui/Primitives';
import { toast } from '../components/ui/Toast';
import { cn, formatClock, formatShortDate } from '../lib/utils';
import type { ID, Room } from '../data/types';

type Stage = 'capture' | 'preview' | 'handover';

export default function DutyReportPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const duties = useDormStore((s) => s.duties);
  const reports = useDormStore((s) => s.reports);
  const queue = useDormStore((s) => s.queue);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const completeDuty = useDormStore((s) => s.completeDuty);

  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('capture');
  /**
   * `completeDuty` immediately points the store at the next room, so the
   * handover is snapshotted before that happens. Otherwise the summary would
   * congratulate you on 206 -> 207 instead of the 205 -> 206 you just did.
   */
  const [handover, setHandover] = useState<{ fromId: ID; toId: ID | null; at: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeDuty = useMemo(() => duties.find((d) => d.id === activeDutyId) ?? null, [duties, activeDutyId]);
  const ring = useMemo(
    () => queue.map((q) => ROOMS.find((r) => r.id === q)).filter((r): r is Room => Boolean(r)),
    [queue],
  );
  const room = ROOMS.find((r) => r.id === activeDuty?.roomId) ?? null;
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const existingReport = reports.find((r) => r.dutyId === activeDuty?.id) ?? null;

  // Already closed → show the handover that already happened.
  useEffect(() => {
    if (activeDuty?.status === 'completed') setStage('handover');
  }, [activeDuty?.status]);

  const done = activeDuty?.completedItems.length ?? 0;
  const total = activeDuty?.checklist.length ?? 0;
  const allDone = done > 0 && done === total;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!isImage(file)) {
      setError('That file is not an image. Try a JPEG or PNG from your camera roll.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('That photo is over 12 MB. Pick a smaller one, or take a new one at normal quality.');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      setPhoto(dataUrl);
      setStage('preview');
    } catch {
      setError('We could not read that image. Try a different file.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    void pick(e.dataTransfer.files?.[0]);
  };

  const confirm = () => {
    if (!activeDuty) return;
    const payload = photo ?? existingReport?.photoUrl ?? '';
    if (!payload) {
      setError('Add a photo of the corridor before completing the duty.');
      return;
    }
    setHandover({
      fromId: activeDuty.roomId,
      toId: nextRoom?.id ?? null,
      at: new Date().toISOString(),
    });
    completeDuty(activeDuty.id, payload, note.trim());
    setStage('handover');
    toast.success('Duty completed', `The ring moved to room ${nextRoom?.number ?? 'the next room'}.`);
  };

  if (!activeDuty || !room) {
    return (
      <div className="space-y-6">
        <Link to="/duty" className="inline-flex items-center gap-2 text-xs text-text-mist hover:text-text">
          <ArrowLeft className="size-3.5" strokeWidth={1.7} />
          Duty
        </Link>
        <EmptyState as="h1"
          title="No duty to report on"
          body="Open a duty from the floor plan first, then come back to attach the photo."
          action={
            <ButtonLink to="/floor" variant="ghost" size="sm">
              Go to the floor plan
            </ButtonLink>
          }
        />
      </div>
    );
  }

  // Once handed over, the "from" room is the snapshot, not whatever the ring
  // has advanced to since.
  const handoverFrom = ROOMS.find((r) => r.id === handover?.fromId) ?? room;
  const handoverTo = ROOMS.find((r) => r.id === handover?.toId) ?? nextRoom;

  return (
    <div className="space-y-8">
      <Link to="/duty" className="inline-flex items-center gap-2 text-xs text-text-mist transition-colors hover:text-text">
        <ArrowLeft className="size-3.5" strokeWidth={1.7} />
        Duty
      </Link>

      <header>
        <p className="engrave">Photo report</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <span
            className="plate px-4 py-2 text-2xl tracking-[0.16em]"
            style={{
              borderColor: ROOM_VISUALS.duty_today.tint,
              background: ROOM_VISUALS.duty_today.tint,
              color: ROOM_VISUALS.duty_today.text,
            }}
          >
            {stage === 'handover' ? handoverFrom.number : room.number}
          </span>
          <div>
            <h1 className="font-display text-display-sm font-semibold leading-[1] text-text">
              Close the duty with one photo
            </h1>
            <p className="mt-2 text-sm text-text-mist">
              {formatShortDate(activeDuty.date)} · {activeDuty.windowStart}–{activeDuty.windowEnd} ·{' '}
              {residentsOf((stage === 'handover' ? handoverFrom : room).id).length} residents
            </p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {stage === 'handover' ? (
          <HandoverStage
            key="handover"
            reduced={reduced}
            fromRoom={handoverFrom}
            toRoom={handoverTo}
            note={note}
            photo={photo ?? existingReport?.photoUrl ?? null}
            completedAt={handover?.at ?? activeDuty.completedAt}
            onBack={() => navigate('/dashboard')}
            onAgain={() => {
              setPhoto(null);
              setNote('');
              setStage('capture');
            }}
          />
        ) : (
          <motion.div
            key="capture"
            initial={reduced ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
          >
            {/* ------------------------------------------------------- */}
            <section className="panel overflow-hidden p-0">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="relative flex min-h-[19rem] flex-col items-center justify-center gap-4 p-6 text-center"
              >
                <AnimatePresence mode="wait">
                  {photo ? (
                    <motion.div
                      key="preview"
                      initial={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full"
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-graphite-950/10">
                        <img src={photo} alt="Duty photo preview" className="max-h-[26rem] w-full object-cover" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950 to-transparent" />
                        <p className="absolute bottom-3 left-3 font-mono text-[11px] uppercase tracking-[0.18em] text-mint-600">
                          Preview · stored on this device
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="drop"
                      initial={reduced ? undefined : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <span className="relative grid size-16 place-items-center rounded-2xl border border-graphite-950/10 bg-ink-900 text-text-mist">
                        <Camera className="size-6" strokeWidth={1.4} />
                        <span className="absolute inset-0 rounded-2xl bg-brass-400/10 blur-xl" />
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold tracking-tight text-text">
                          Drop a photo of the corridor
                        </p>
                        <p className="mx-auto mt-1.5 max-w-[34ch] text-sm text-text-mist text-pretty">
                          JPEG or PNG, up to 12 MB. It gets resized in your browser before anything is
                          stored.
                        </p>
                      </div>
                      <Button onClick={() => fileRef.current?.click()} loading={busy} icon={<Upload className="size-4" />}>
                        Choose a photo
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void pick(e.target.files?.[0])}
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 border-t border-alert/25 bg-alert/[0.07] px-4 py-3 text-xs leading-relaxed text-alert"
                >
                  <ImageOff className="mt-px size-3.5 shrink-0" strokeWidth={1.8} />
                  {error}
                </p>
              ) : null}
            </section>

            {/* ------------------------------------------------------- */}
            <aside className="space-y-4">
              <div className="panel p-5 sm:p-6">
                <p className="engrave">Before you confirm</p>
                <ul className="mt-4 space-y-2.5">
                  {activeDuty.checklist.map((c) => {
                    const ok = activeDuty.completedItems.includes(c.id);
                    return (
                      <li key={c.id} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'grid size-5 shrink-0 place-items-center rounded-md border',
                            ok ? 'border-mint-400 bg-mint-400 text-ink-950' : 'border-graphite-950/15 text-transparent',
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className={cn('text-sm', ok ? 'text-text' : 'text-text-dim')}>{c.label}</span>
                      </li>
                    );
                  })}
                </ul>
                <ProgressBar value={(done / Math.max(1, total)) * 100} tone={allDone ? 'mint' : 'brass'} className="mt-4" />

                <label htmlFor="note" className="mt-5 block text-xs font-medium text-text-mist">
                  Note for the next room <span className="text-text-dim">(optional)</span>
                </label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. radiator in 206 is dripping again"
                  className="field mt-1.5 resize-none"
                  maxLength={160}
                />
                <p className="mt-1 text-right font-mono text-[10px] tabular-nums text-text-dim">
                  {note.length}/160
                </p>
              </div>

              <div className="panel p-5 sm:p-6">
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    onClick={confirm}
                    loading={busy}
                    disabled={!photo}
                    icon={<Check className="size-4" strokeWidth={2.4} />}
                  >
                    Complete duty
                  </Button>
                  {photo ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPhoto(null);
                        setStage('capture');
                      }}
                      icon={<Trash2 className="size-4" />}
                    >
                      Discard
                    </Button>
                  ) : null}
                </div>
                {!photo ? (
                  <p className="mt-3 text-xs text-text-dim">
                    {allDone
                      ? 'All checks are done. Add a photo to close the duty.'
                      : `${total - done} check${total - done === 1 ? '' : 's'} still open — you can still report, but the warden will see an incomplete list.`}
                  </p>
                ) : null}
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Handover — the one moment the whole product builds toward                  */
/* -------------------------------------------------------------------------- */

function HandoverStage({
  reduced,
  fromRoom,
  toRoom,
  note,
  photo,
  completedAt,
  onBack,
  onAgain,
}: {
  reduced: boolean;
  fromRoom: Room;
  toRoom: Room | null;
  note: string;
  photo: string | null;
  completedAt: string | null;
  onBack: () => void;
  onAgain: () => void;
}) {
  const brass = ROOM_VISUALS.duty_today.glow;
  const mint = ROOM_VISUALS.next_duty.glow;

  return (
    <motion.section
      initial={reduced ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-mint-400/20 bg-gradient-to-b from-mint-400/[0.07] via-ink-850/70 to-ink-850/70 p-6 shadow-card backdrop-blur-xl sm:p-10"
    >
      <div className="pointer-events-none absolute -left-20 top-0 size-80 rounded-full bg-mint-400/10 blur-[90px]" />

      <div className="relative mx-auto max-w-2xl text-center">
        {/* success mark */}
        <motion.span
          initial={reduced ? undefined : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto grid size-16 place-items-center rounded-full border border-mint-400/40 bg-mint-400/12"
        >
          <motion.svg viewBox="0 0 24 24" className="size-7 text-mint-600" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <motion.path
              d="M4 12.5l5.2 5L20 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? undefined : { pathLength: 0 }}
              animate={reduced ? undefined : { pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            />
          </motion.svg>
          {!reduced ? (
            <motion.span
              className="absolute inset-0 rounded-full border border-mint-400"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 1.6, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
            />
          ) : null}
        </motion.span>

        <p className="engrave mt-6">Duty completed</p>
        <h2 className="mt-2.5 font-display text-display-sm font-semibold leading-[1.02] text-text">
          Handed over
        </h2>
        {completedAt ? (
          <p className="mt-3 font-mono text-xs tabular-nums text-text-dim">
            closed {formatClock(completedAt)}
            {note ? ` · “${note}”` : ''}
          </p>
        ) : null}
      </div>

      {/* the handover itself */}
      <div className="relative mx-auto mt-10 flex max-w-xl items-center gap-3 sm:gap-5">
        <HandoverPlate label="Closed" value={fromRoom.number} color={brass} delay={0.15} reduced={reduced} />

        <div className="relative flex-1">
          <div className="h-px w-full bg-gradient-to-r from-brass-400/50 to-mint-400/50" />
          <motion.span
            initial={reduced ? undefined : { left: '0%', opacity: 0 }}
            animate={reduced ? undefined : { left: '100%', opacity: [0, 1, 1, 0] }}
            transition={reduced ? undefined : { duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint-300 shadow-signal"
          />
          <p className="mt-3 text-center text-2xs font-semibold uppercase tracking-[0.2em] text-mint-600">
            Duty passed
          </p>
        </div>

        <HandoverPlate label="Next" value={toRoom?.number ?? '—'} color={mint} delay={0.45} reduced={reduced} />
      </div>

      {photo ? (
        <motion.figure
          initial={reduced ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-10 max-w-md overflow-hidden rounded-2xl border border-graphite-950/10"
        >
          <img src={photo} alt="Filed duty report" className="max-h-72 w-full object-cover" />
          <figcaption className="flex items-center justify-between gap-3 bg-ink-900/80 px-4 py-2.5 backdrop-blur">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-mist">
              Filed report
            </span>
            <span className="text-[11px] text-text-dim">room {fromRoom.number}</span>
          </figcaption>
        </motion.figure>
      ) : null}

      <div className="relative mt-9 flex flex-wrap justify-center gap-2.5">
        <Button onClick={onBack} icon={<ArrowRight className="size-4" />}>
          Back to overview
        </Button>
        <Button variant="ghost" onClick={onAgain} icon={<RotateCcw className="size-4" />}>
          Add another report
        </Button>
      </div>
    </motion.section>
  );
}

function HandoverPlate({
  label,
  value,
  color,
  delay,
  reduced,
}: {
  label: string;
  value: string;
  color: string;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 text-center"
    >
      <p className="engrave">{label}</p>
      <p
        className="mt-2 rounded-2xl border px-4 py-2.5 font-mono text-2xl font-semibold tracking-[0.14em] backdrop-blur"
        style={{ borderColor: `${color}44`, background: `${color}10`, color }}
      >
        {value}
      </p>
    </motion.div>
  );
}
