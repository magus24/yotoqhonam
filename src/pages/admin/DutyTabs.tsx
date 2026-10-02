import { Link } from 'react-router-dom';
import { BedDouble, Database, HardDrive, ShieldCheck, Users } from 'lucide-react';
import { ROOM_VISUALS } from '../../data/dutyQueue';
import { useDormStore } from '../../store/dormStore';
import { useAllRooms, useDormHistoryRooms, useDormitories, useOccupancy } from '../../store/useRegistry';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, SectionTitle } from '../../components/ui/Primitives';
import { formatClock, formatShortDate } from '../../lib/utils';
export function DutiesTab() {
  const duties = useDormStore((s) => s.duties);
  const { rooms, inScope } = useDormHistoryRooms();
  const sorted = duties
    .filter((d) => inScope(d.roomId))
    .sort((a, b) => b.date.localeCompare(a.date) || a.roomId.localeCompare(b.roomId));

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No duty records here"
        body="This residence is not on the rotation yet. Add its rooms to the queue from the duty page, or check another residence."
        action={
          <ButtonLink to="/duty" variant="ghost" size="sm">
            Go to duty
          </ButtonLink>
        }
      />
    );
  }

  return (
    <section className="panel overflow-hidden">
      <ul className="divide-y divide-line">
        {sorted.map((d) => {
          const room = rooms.find((r) => r.id === d.roomId);
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

export function ReportsTab() {
  const reports = useDormStore((s) => s.reports);
  const duties = useDormStore((s) => s.duties);
  const { rooms, inScope } = useDormHistoryRooms();
  const scoped = reports.filter((rep) => {
    const duty = duties.find((d) => d.id === rep.dutyId);
    return duty ? inScope(duty.roomId) : true;
  });

  if (scoped.length === 0) {
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
      {scoped.map((rep) => {
        const duty = duties.find((d) => d.id === rep.dutyId);
        const room = rooms.find((r) => r.id === duty?.roomId);
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

export function StackTab() {
  const dormitories = useDormitories();
  const rooms = useAllRooms();
  const occupancy = useOccupancy();

  const rows: { icon: typeof Database; label: string; value: string; note: string }[] = [
    {
      icon: Database,
      label: 'Data',
      value: 'One persisted registry',
      note: `${dormitories.length} dormitories, ${rooms.length} rooms, ${occupancy.capacity} beds and ${occupancy.occupied} residents live in yotoqhonam.state.v1 and drive every screen`,
    },
    {
      icon: BedDouble,
      label: 'Occupancy',
      value: 'Derived from Bed.studentId',
      note: 'A place holds at most one person, so double booking is impossible in the data rather than merely checked in the UI',
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
      note: 'src/store/authStore.ts resolves a typed User; residents are separate registry records linked by userId',
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
Backend   auth · dormitories · floors · rooms · beds · students · duties · reports
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
