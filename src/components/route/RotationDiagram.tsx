import { motion } from 'framer-motion';
import type { ID, Room } from '../../data/types';
import { getNextDutyRoom } from '../../data/dutyQueue';
import { useFloor, useRoom, useRoomResidentNames } from '../../store/useRegistry';
import { cn } from '../../lib/utils';

/**
 * The duty ring, drawn as a physical brass line threading room plates.
 * This is the same idea as the handover line in the 3D scene, flattened
 * for the page — one concept, two renderings.
 */
export function RotationDiagram({
  rooms,
  activeRoomId,
  className,
  reducedMotion,
}: {
  rooms: Room[];
  activeRoomId: ID | null;
  className?: string;
  reducedMotion?: boolean;
}) {
  const next = getNextDutyRoom(activeRoomId ?? rooms[0]?.id ?? '', rooms);
  const residentNames = useRoomResidentNames();
  const floor = useFloor(useRoom(rooms[0]?.id)?.floorId);

  return (
    <div className={cn('relative', className)}>
      <div className="panel grain overflow-hidden p-5 sm:p-7">
        <div className="flex items-baseline justify-between gap-4">
          <p className="engrave">
            Tonight{floor ? ` · ${floor.name}` : ''}
          </p>
          <p className="font-mono text-xs tabular-nums text-text-dim">
            {rooms.length} in ring
          </p>
        </div>

        <ol className="mt-5 space-y-0">
          {rooms.map((room, i) => {
            const isActive = room.id === activeRoomId;
            const isNext = room.id === next?.id;
            const last = i === rooms.length - 1;
            const names = residentNames.get(room.id) ?? [];

            return (
              <li key={room.id} className="relative flex gap-4 pb-1">
                {/* the brass line */}
                <div className="relative flex w-8 shrink-0 justify-center">
                  {!last ? (
                    <motion.span
                      className="absolute top-9 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-brass-400/70 to-brass-400/15"
                      initial={reducedMotion ? undefined : { scaleY: 0 }}
                      whileInView={reducedMotion ? undefined : { scaleY: 1 }}
                      viewport={{ once: true }}
                      style={{ originY: 0 }}
                      transition={{ duration: 0.6, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    />
                  ) : (
                    <span className="absolute top-9 h-px w-6 translate-x-2 rounded-full bg-brass-400/50" />
                  )}
                  <span
                    className={cn(
                      'relative z-10 mt-3 grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] transition-colors',
                      isActive
                        ? 'border-brass-400 bg-brass-400 text-ink-950'
                        : isNext
                          ? 'border-mint-400/70 bg-mint-400/15 text-mint-600'
                          : 'border-graphite-950/12 bg-ink-800 text-text-dim',
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        className="absolute inset-0 rounded-full border border-brass-400"
                        animate={reducedMotion ? undefined : { scale: [1, 1.6], opacity: [0.7, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                    ) : null}
                    {i + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1 pb-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'plate',
                        isActive && 'border-brass-400/50 bg-brass-400/12 text-brass-600',
                        isNext && 'border-mint-400/40 text-mint-600',
                      )}
                    >
                      {room.number}
                    </span>
                    <p className="text-sm text-text-mist">
                      {names.length} {names.length === 1 ? 'resident' : 'residents'}
                    </p>
                    {isActive ? (
                      <span className="ml-auto text-2xs font-semibold uppercase tracking-[0.18em] text-brass-600">
                        On duty
                      </span>
                    ) : isNext ? (
                      <span className="ml-auto text-2xs font-semibold uppercase tracking-[0.18em] text-mint-600">
                        Next
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-xs text-text-dim">{names.join(', ')}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-1 border-t border-graphite-950/[0.09] pt-4 text-xs leading-relaxed text-text-dim text-pretty">
          {next
            ? `After room ${next.number} the ring returns to the first room.`
            : 'The ring has one room, so it closes on itself.'}{' '}
          Nothing is hard-coded — the order lives in one list.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compact horizontal variant for the dashboard                               */
/* -------------------------------------------------------------------------- */

export function RotationTicker({
  rooms,
  activeRoomId,
  className,
}: {
  rooms: Room[];
  activeRoomId: ID | null;
  className?: string;
}) {
  const residentNames = useRoomResidentNames();
  const start = Math.max(0, rooms.findIndex((r) => r.id === activeRoomId));
  const ordered = [...rooms.slice(start), ...rooms.slice(0, start)];

  return (
    <div className={cn('no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0', className)}>
      <ol className="flex items-stretch gap-0">
        {ordered.map((room, i) => {
          const isActive = room.id === activeRoomId;
          const count = residentNames.get(room.id)?.length ?? 0;
          return (
            <li key={room.id} className="flex items-center">
              <div
                className={cn(
                  'flex flex-col gap-0.5 rounded-xl border px-3 py-2 transition-colors',
                  isActive
                    ? 'border-brass-400/45 bg-brass-400/10'
                    : 'border-graphite-950/[0.09] bg-graphite-950/[0.03]',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-sm font-semibold tracking-[0.14em]',
                    isActive ? 'text-brass-600' : 'text-text-mist',
                  )}
                >
                  {room.number}
                </span>
                <span className="text-[10px] text-text-dim">
                  {count} {count === 1 ? 'resident' : 'residents'}
                </span>
              </div>
              {i < ordered.length - 1 ? (
                <svg viewBox="0 0 24 12" className="h-3 w-6 shrink-0 text-brass-600/40" aria-hidden>
                  <path d="M0 6h18M14 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 12" className="h-3 w-6 shrink-0 text-brass-600/40" aria-hidden>
                  <path d="M0 6h8a4 4 0 010 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
