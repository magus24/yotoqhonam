import { cn } from '../../lib/utils';
import type { Student } from '../../data/types';
import { useDormBeds, useDormRooms, useFloors, useStudents } from '../../store/useRegistry';
import { EmptyState } from '../../components/ui/Primitives';

/**
 * The occupied/free view. A bed is the unit a student actually holds, so this
 * is where "band" and "bo‘sh" are literally distinguishable rather than
 * inferred from a capacity number.
 */
export function BedsTab({ onMove }: { onMove: (s: Student) => void }) {
  const rooms = useDormRooms();
  const floors = useFloors();
  const beds = useDormBeds();
  const students = useStudents();

  if (beds.length === 0) {
    return <EmptyState title="No beds yet" body="Create a room and give it a capacity — the beds appear here." />;
  }

  return (
    <section className="space-y-4">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floorId === floor.id);
        if (floorRooms.length === 0) return null;
        const floorBeds = beds.filter((b) => floorRooms.some((r) => r.id === b.roomId));
        return (
          <div key={floor.id} className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <span className="plate px-2 py-0.5 text-[11px]">{floor.number}</span>
              <p className="text-sm font-medium text-text">{floor.name}</p>
              <p className="ml-auto font-mono text-[11px] tabular-nums text-text-dim">
                {floorBeds.filter((b) => b.studentId !== null).length}/{floorBeds.length}
              </p>
            </div>
            <div className="divide-y divide-line">
              {floorRooms.map((room) => {
                const roomBeds = beds
                  .filter((b) => b.roomId === room.id)
                  .sort((a, b) => a.number - b.number);
                return (
                  <div key={room.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="plate px-1.5 py-0.5 text-[11px]">{room.number}</span>
                      <span className="font-mono text-[11px] uppercase text-text-dim">{room.side}</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {roomBeds.map((bed) => {
                        const holder = bed.studentId ? students.find((s) => s.id === bed.studentId) : null;
                        return (
                          <button
                            key={bed.id}
                            type="button"
                            disabled={!holder}
                            onClick={() => holder && onMove(holder)}
                            title={
                              holder
                                ? `${holder.name} — ko‘chirish uchun bosing`
                                : `${bed.number}-joy bo‘sh`
                            }
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors',
                              holder
                                ? 'border-mint-600/30 bg-mint-400/10 text-mint-700 hover:border-mint-600/60'
                                : 'cursor-default border-dashed border-graphite-950/20 text-text-dim',
                            )}
                          >
                            <span className="font-mono tabular-nums">{bed.number}</span>
                            <span className="max-w-[7rem] truncate">
                              {holder ? holder.name.split(' ')[0] : 'bo‘sh'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs leading-relaxed text-text-dim">
        Band joylar yashil, bo‘sh joylar punktirli. Talabaga bosilsangiz, uni ko‘chirish oynasi ochiladi.
      </p>
    </section>
  );
}
