import { Pencil, Plus } from 'lucide-react';
import type { Floor, Room } from '../../data/types';
import { useDormStore } from '../../store/dormStore';
import { useDormBeds, useDormRooms, useFloors } from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Primitives';
import { DangerButton, report } from './ui';

export function FloorsTab({
  onAddFloor,
  onEditFloor,
  onOpenRoom,
}: {
  onAddFloor: () => void;
  onEditFloor: (f: Floor) => void;
  onOpenRoom: (r: Room) => void;
}) {
  const floors = useFloors();
  const rooms = useDormRooms();
  const beds = useDormBeds();
  const deleteFloor = useDormStore((s) => s.deleteFloor);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-text-mist">
          {floors.length} qavat · {rooms.length} xona · {beds.length} joy
        </p>
        <Button size="sm" className="ml-auto" onClick={onAddFloor} icon={<Plus className="size-3.5" />}>
          Qavat qo‘shish
        </Button>
      </div>

      {floors.length === 0 ? (
        <EmptyState
          title="No floors yet"
          body="A residence needs at least one floor before rooms can be added."
          action={
            <Button size="sm" onClick={onAddFloor}>
              Add floor
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {floors.map((f) => {
            const floorRooms = rooms.filter((r) => r.floorId === f.id);
            const capacity = floorRooms.reduce((n, r) => n + r.capacity, 0);
            const filled = beds.filter(
              (b) => b.studentId !== null && floorRooms.some((r) => r.id === b.roomId),
            ).length;
            return (
              <li key={f.id} className="panel-quiet p-4">
                <div className="flex items-start gap-3">
                  <span className="plate shrink-0 px-2 py-1 text-[11px]">{f.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{f.name}</p>
                    <p className="font-mono text-[11px] tabular-nums text-text-dim">
                      {floorRooms.length} xona · {filled}/{capacity} joy band
                    </p>
                  </div>
                </div>

                {floorRooms.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {floorRooms.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => onOpenRoom(r)}
                          className="rounded-lg border border-graphite-950/10 px-2 py-0.5 font-mono text-[11px] text-text-mist transition-colors hover:border-graphite-950/25 hover:text-text"
                        >
                          {r.number}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-text-dim">Xonalar yo‘q.</p>
                )}

                <div className="mt-3.5 flex flex-wrap gap-2 border-t border-graphite-950/[0.07] pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditFloor(f)}
                    icon={<Pencil className="size-3.5" />}
                  >
                    Tahrirlash
                  </Button>
                  <DangerButton
                    label="O‘chirish"
                    onClick={() => report(deleteFloor(f.id), ['O‘chirildi', `${f.name} o‘chirildi.`])}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
