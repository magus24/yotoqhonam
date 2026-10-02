import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { Student } from '../../data/types';
import { useDormStore } from '../../store/dormStore';
import { usePlacements, useStudents } from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { EmptyState, KeyTag } from '../../components/ui/Primitives';
import { DangerButton, report } from './ui';

export function StudentsTab({
  onAdd,
  onEdit,
  onMove,
}: {
  onAdd: () => void;
  onEdit: (s: Student) => void;
  onMove: (s: Student) => void;
}) {
  const [q, setQ] = useState('');
  const students = useStudents();
  const placements = usePlacements();
  const evictStudent = useDormStore((s) => s.evictStudent);
  const deleteStudent = useDormStore((s) => s.deleteStudent);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((s) => {
      const where = placements.get(s.id);
      return (
        s.name.toLowerCase().includes(needle) ||
        (s.email ?? '').toLowerCase().includes(needle) ||
        (s.studentId ?? '').toLowerCase().includes(needle) ||
        (s.phone ?? '').includes(needle) ||
        (where?.room?.number ?? '').includes(needle)
      );
    });
  }, [students, placements, q]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, ID, phone or room"
          aria-label="Search residents"
          className="field max-w-xs"
        />
        <p className="font-mono text-xs tabular-nums text-text-dim">
          {filtered.length} of {students.length}
        </p>
        <Button size="sm" className="sm:ml-auto" onClick={onAdd} icon={<Plus className="size-3.5" />}>
          Talaba qo‘shish
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          body="Try a different name, ID fragment or room number, or add a new student to the register."
          action={
            <Button size="sm" onClick={onAdd}>
              Add student
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((s) => {
            const where = placements.get(s.id);
            const placed = Boolean(where);
            return (
              <li key={s.id} className="panel-quiet p-4">
                <div className="flex items-start gap-3">
                  <KeyTag initials={s.initials} tone={placed ? 'default' : 'brass'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{s.name}</p>
                    <p className="truncate font-mono text-[11px] text-text-dim">
                      {s.studentId ? `ID ${s.studentId}` : 'ID berilmagan'}
                      {s.course ? ` · ${s.course}-kurs` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {placed ? (
                      <span className="plate px-1.5 py-0.5 text-[11px]">
                        {where?.room?.number ?? '—'} · {where?.bed.number}-joy
                      </span>
                    ) : (
                      <span className="rounded-full border border-brass-400/35 bg-brass-400/12 px-2 py-0.5 text-[10px] font-semibold text-brass-600">
                        joyda yo‘q
                      </span>
                    )}
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-text-mist">
                  <div className="truncate">
                    <dt className="inline text-text-dim">Tel: </dt>
                    <dd className="inline">{s.phone || '—'}</dd>
                  </div>
                  <div className="truncate">
                    <dt className="inline text-text-dim">Fakultet: </dt>
                    <dd className="inline">{s.faculty || '—'}</dd>
                  </div>
                </dl>

                <div className="mt-3.5 flex flex-wrap gap-2 border-t border-graphite-950/[0.07] pt-3">
                  <Button variant="ghost" size="sm" onClick={() => onMove(s)}>
                    {placed ? 'Ko‘chirish' : 'Joy berish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(s)}
                    icon={<Pencil className="size-3.5" />}
                  >
                    Tahrirlash
                  </Button>
                  {placed ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => report(evictStudent(s.id), ['Bo‘shatildi', `${s.name} endi joyga tegishli emas.`])}
                    >
                      Bo‘shatish
                    </Button>
                  ) : null}
                  {!placed ? (
                    <DangerButton
                      label="O‘chirish"
                      onClick={() => report(deleteStudent(s.id), ['O‘chirildi', `${s.name} ro‘yxatdan olib tashlandi.`])}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
