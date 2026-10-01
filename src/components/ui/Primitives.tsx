import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ROOM_VISUALS } from '../../data/dutyQueue';
import type { RoomState } from '../../data/types';
import { cn } from '../../lib/utils';

/* -------------------------------------------------------------------------- */
/* RoomStateDot — the one place a room's status colour is defined for the UI    */
/* -------------------------------------------------------------------------- */

const DOT: Record<RoomState, string> = {
  ready: 'bg-mint-400',
  duty_today: 'bg-brass-400',
  next_duty: 'bg-brand-300',
  neutral: 'bg-text-dim',
};

export function RoomStateDot({ state, className, pulse = false }: { state: RoomState; className?: string; pulse?: boolean }) {
  return (
    <span className={cn('relative inline-flex size-2', className)}>
      {pulse && <span className={cn('absolute inset-0 rounded-full animate-pulse-ring', DOT[state])} />}
      <span className={cn('relative size-2 rounded-full', DOT[state])} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* RoomStateBadge                                                             */
/* -------------------------------------------------------------------------- */

export function RoomStateBadge({ state, className }: { state: RoomState; className?: string }) {
  const v = ROOM_VISUALS[state];
  const ring: Record<RoomState, string> = {
    ready: 'border-mint-400/30 bg-mint-400/10 text-mint-600',
    duty_today: 'border-brass-400/35 bg-brass-400/12 text-brass-600',
    next_duty: 'border-brand-300/30 bg-brand-300/10 text-brand-200',
    neutral: 'border-graphite-950/10 bg-graphite-950/[0.05] text-text-mist',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold',
        ring[state],
        className,
      )}
    >
      <RoomStateDot state={state} />
      {v.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat                                                                        */
/* -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('panel-quiet p-4', className)}>
      <p className="engrave">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-text sm:text-[28px]">{value}</p>
      {sub ? <p className="mt-1 text-xs text-text-mist">{sub}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                             */
/* -------------------------------------------------------------------------- */

export function SectionTitle({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <h2 className="font-display text-xl font-semibold tracking-tight text-text sm:text-2xl">{children}</h2>
      {hint ? <div className="shrink-0 text-xs text-text-mist">{hint}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state — an invitation to act, not an apology                           */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  body,
  action,
  as: Tag = 'p',
}: {
  title: string;
  body: string;
  action?: ReactNode;
  /** Page-level empty states should own an h1 so the document keeps its outline. */
  as?: 'h1' | 'h2' | 'p';
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-graphite-950/12 px-6 py-12 text-center">
      <Tag className="font-display text-lg font-semibold text-text">{title}</Tag>
      <p className="max-w-sm text-sm text-text-mist text-pretty">{body}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Divider with label                                                          */
/* -------------------------------------------------------------------------- */

export function LabelledDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-graphite-950/10" />
      <span className="engrave">{children}</span>
      <span className="h-px flex-1 bg-graphite-950/10" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* KeyTag — the monogram chip used for residents                               */
/* -------------------------------------------------------------------------- */

export function KeyTag({
  initials,
  tone = 'default',
  className,
}: {
  initials: string;
  tone?: 'default' | 'brass' | 'mint';
  className?: string;
}) {
  const tones = {
    default: 'border-graphite-950/12 bg-graphite-950/[0.06] text-text-mist',
    brass: 'border-brass-400/35 bg-brass-400/12 text-brass-600',
    mint: 'border-mint-400/35 bg-mint-400/12 text-mint-600',
  };
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-semibold tracking-wider',
        tones[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Reveal — one orchestrated entrance, used sparingly                          */
/* -------------------------------------------------------------------------- */

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* ProgressBar                                                                 */
/* -------------------------------------------------------------------------- */

export function ProgressBar({ value, tone = 'brass', className }: { value: number; tone?: 'brass' | 'mint'; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-graphite-950/[0.08]', className)}>
      <motion.div
        className={cn('h-full rounded-full', tone === 'brass' ? 'bg-brass-400' : 'bg-mint-400')}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
