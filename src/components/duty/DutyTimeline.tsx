import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Duty } from '../../data/types';
import { cn, formatClock } from '../../lib/utils';

const STAGES = [
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'awaiting_report', label: 'Report due' },
  { key: 'completed', label: 'Handed over' },
] as const;

const ORDER: Record<Duty['status'], number> = {
  pending: 0,
  in_progress: 1,
  awaiting_report: 2,
  skipped: 2,
  completed: 3,
};

/** Four beats, one line. Reads the duty as a sequence, not a set of badges. */
export function DutyTimeline({
  status,
  startedAt,
  completedAt,
  className,
  compact = false,
}: {
  status: Duty['status'];
  startedAt: string | null;
  completedAt: string | null;
  className?: string;
  compact?: boolean;
}) {
  const current = ORDER[status];

  /** Each beat carries the clock time it actually happened at. */
  const stampFor = (index: number): string | null => {
    if (index === 1 && startedAt) return formatClock(startedAt);
    if (index === 3 && completedAt) return formatClock(completedAt);
    return null;
  };

  return (
    <ol className={cn('flex items-start', compact ? 'gap-1' : 'gap-2', className)}>
      {STAGES.map((stage, i) => {
        const reached = i <= current;
        const isCurrent = i === current;
        const stamp = reached ? stampFor(i) : null;
        return (
          <li key={stage.key} className="relative flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center">
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full border text-[10px] transition-colors duration-500',
                  reached
                    ? 'border-brass-400 bg-brass-400 text-ink-950'
                    : 'border-graphite-950/12 bg-ink-900 text-text-dim',
                )}
              >
                {i < current ? (
                  <Check className="size-3" strokeWidth={2.6} />
                ) : isCurrent ? (
                  <motion.span
                    className="size-1.5 rounded-full bg-ink-950"
                    animate={{ scale: [1, 0.55, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : (
                  <span className="size-1 rounded-full bg-graphite-950/20" />
                )}
              </span>
              {i < STAGES.length - 1 ? (
                <span className="relative h-px flex-1 bg-graphite-950/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-brass-400"
                    initial={{ width: 0 }}
                    animate={{ width: i < current ? '100%' : '0%' }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                'truncate text-[10px] font-medium tracking-wide transition-colors',
                isCurrent ? 'text-brass-600' : reached ? 'text-text-mist' : 'text-text-dim',
              )}
            >
              {stage.label}
            </span>
            <span className="truncate font-mono text-[9px] tabular-nums text-text-dim">
              {stamp ?? ' '}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function DutyStamp({ duty }: { duty: Duty }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-text-dim">
      {duty.windowStart}–{duty.windowEnd}
      {duty.startedAt ? <span>· started {formatClock(duty.startedAt)}</span> : null}
      {duty.completedAt ? <span>· closed {formatClock(duty.completedAt)}</span> : null}
    </p>
  );
}
