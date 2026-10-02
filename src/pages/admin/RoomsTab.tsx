import { Pencil, Plus } from 'lucide-react';
import type { ID, Room } from '../../data/types';
import { useDormBeds, useDormRooms, useFloors } from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';

export function RoomsTab({
  ring,
  onOpen,
  onAdd,
}: {
  ring: Room[];
  onOpen: (r: Room) => void;
  onAdd: (floorId: ID) => void;
}) {
  const rooms = useDormRooms();
  const floors = useFloors();
  const beds = useDormBeds();

  return (
    <section className="space-y-4">
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floorId === floor.id);
        return (
          <div key={floor.id} className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
              <span className="plate px-2 py-0.5 text-[11px]">{floor.number}</span>
              <p className="text-sm font-medium text-text">{floor.name}</p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => onAdd(floor.id)}
                icon={<Plus className="size-3.5" />}
              >
                Xona qo‘shish
              </Button>
            </div>
            {floorRooms.length === 0 ? (
              <p className="px-5 py-4 text-sm text-text-dim">Bu qavatda hali xona yo‘q.</p>
            ) : (
              <ul className="divide-y divide-line">
                {floorRooms.map((room) => {
                  const occupied = beds.filter((b) => b.roomId === room.id && b.studentId !== null).length;
                  const inRing = ring.some((r) => r.id === room.id);
                  return (
                    <li
                      key={room.id}
                      className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[5rem_1fr_8rem_6rem_4rem]"
                    >
                      <button
                        onClick={() => onOpen(room)}
                        className="plate w-fit px-2 py-0.5 text-[11px]"
                        aria-label={`Edit room ${room.number}`}
                      >
                        {room.number}
                      </button>
                      <span className="min-w-0 truncate text-sm tabular-nums text-text-mist">
                        {occupied}/{room.capacity} joy band
                        {occupied >= room.capacity ? (
                          <span className="ml-2 text-[11px] text-brass-600">to‘lgan</span>
                        ) : null}
                      </span>
                      <span className="hidden text-[11px] uppercase text-text-dim sm:block">{room.side}</span>
                      <span className="hidden text-sm sm:block">
                        {inRing ? (
                          <span className="text-mint-600">navbatda</span>
                        ) : (
                          <span className="text-text-dim">yo‘q</span>
                        )}
                      </span>
                      <span className="justify-self-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpen(room)}
                          icon={<Pencil className="size-3.5" />}
                        >
                          <span className="sr-only">Edit room {room.number}</span>
                        </Button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      <p className="text-xs leading-relaxed text-text-dim">
        Xona raqami faqat shu qavatda takrorlanmasligi kerak. Sig‘imni kamaytirish uchun avval joylarni
        bo‘shating.
      </p>
    </section>
  );
}
