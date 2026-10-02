import { useEffect, useMemo, useState } from 'react';
import type { Floor, ID, Room } from '../../data/types';
import { useDormStore } from '../../store/dormStore';
import { useDormRooms, useFloors, useRoomBeds } from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Field, report } from './ui';

/* -------------------------------------------------------------------------- */
/* Floor                                                                        */
/* -------------------------------------------------------------------------- */

export function FloorModal({
  state,
  onClose,
}: {
  /** `floor: null` means create; `floorId` is only read in that case. */
  state: { open: boolean; floor: Floor | null };
  onClose: () => void;
}) {
  const addFloor = useDormStore((s) => s.addFloor);
  const updateFloor = useDormStore((s) => s.updateFloor);
  const dormitoryId = useDormStore((s) => s.activeDormitoryId);
  const floors = useFloors();
  const rooms = useDormRooms();

  const editing = state.floor;
  const taken = useMemo(() => new Set(floors.map((f) => f.number)), [floors]);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!state.open) return;
    if (editing) {
      setNumber(String(editing.number));
      setName(editing.name);
    } else {
      setNumber(String(floors.reduce((max, f) => Math.max(max, f.number), 0) + 1));
      setName('');
    }
    // floors is intentionally excluded from the deps: a registry write elsewhere
    // must not wipe a half-typed form. `open` is the only real reset signal.
  }, [state.open, editing]);

  const freeNumber = () => {
    for (let n = 1; n < 100; n += 1) if (!taken.has(n)) return n;
    return floors.length + 1;
  };

  const save = () => {
    if (!dormitoryId) return;
    const payload = { number: Number(number), name };
    const label = name.trim() || `Floor ${payload.number}`;
    const ok = editing
      ? report(updateFloor(editing.id, payload), ['Saqlandi', `${label} yangilandi.`])
      : report(addFloor({ dormitoryId, ...payload }), ['Qo‘shildi', `${label} qo‘shildi.`]);
    if (ok) onClose();
  };

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? 'Qavat ma’lumotlari' : 'Yangi qavat'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" onClick={save}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
          <Field label="Raqam" hint="Bu yotoqxona ichida takrorlanmasin.">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="field"
              inputMode="numeric"
            />
          </Field>
          <Field label="Nomi" hint="Bo‘sh qoldirilsa, “Floor N” deb saqlanadi.">
            <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Floor 3" />
          </Field>
        </div>

        {editing ? (
          <p className="text-[11px] leading-relaxed text-text-dim">
            Bu qavatda {rooms.filter((r) => r.floorId === editing.id).length} xona bor. Qavatni o‘chirish uchun avval
            shularni o‘chiring.
          </p>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setNumber(String(freeNumber()))}>
            Bo‘sh raqamni tanlash
          </Button>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Room — capacity *is* the bed count, so it is edited as a number              */
/* -------------------------------------------------------------------------- */

export function RoomModal({
  state,
  onClose,
}: {
  /** `room: null` means create; `floorId` is only read in that case. */
  state: { open: boolean; room: Room | null; floorId?: ID | null };
  onClose: () => void;
}) {
  const addRoom = useDormStore((s) => s.addRoom);
  const updateRoom = useDormStore((s) => s.updateRoom);
  const deleteRoom = useDormStore((s) => s.deleteRoom);
  const rooms = useDormRooms();
  const floors = useFloors();

  const editing = state.room;
  const parentFloorId = editing?.floorId ?? state.floorId ?? null;
  const roomBeds = useRoomBeds(editing?.id);
  const occupied = roomBeds.filter((b) => b.studentId !== null).length;

  const siblings = useMemo(
    () => rooms.filter((r) => r.floorId === parentFloorId),
    [rooms, parentFloorId],
  );
  const taken = useMemo(() => new Set(siblings.map((r) => r.number)), [siblings]);

  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    if (!state.open) return;
    if (editing) {
      setNumber(editing.number);
      setCapacity(String(editing.capacity));
      return;
    }
    const highest = siblings.reduce((max, r) => Math.max(max, Number(r.number) || 0), 0);
    setNumber(String(highest + 1));
    setCapacity('4');
    // siblings is derived from the store; re-running on every write would wipe a
    // half-typed form, so `open` is the only seeding signal.
  }, [state.open, editing]);

  const freeNumber = () => {
    for (let n = 201; n < 400; n += 1) if (!taken.has(String(n))) return n;
    return 201;
  };

  const save = () => {
    const payload = { number: number.trim(), capacity: Number(capacity) };
    const ok = editing
      ? report(updateRoom(editing.id, payload), ['Saqlandi', `${payload.number}-xona yangilandi.`])
      : parentFloorId
        ? report(addRoom({ floorId: parentFloorId, ...payload }), ['Qo‘shildi', `${payload.number}-xona qo‘shildi.`])
        : { ok: false as const, error: 'Qavatni tanlang.' };
    if (ok) onClose();
  };

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? `Xona ${editing.number}` : 'Yangi xona'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" onClick={save}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Raqam" hint="Faqat shu qavatda takrorlanmasin.">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="field"
              placeholder="205"
              inputMode="numeric"
            />
          </Field>
          <Field
            label="Sig‘im"
            hint={
              editing && occupied > 0
                ? `${occupied} joy band — kamaytirish uchun avval bo‘shating.`
                : '1 dan 12 gacha. Sig‘im = joylar soni.'
            }
          >
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="field"
              inputMode="numeric"
            />
          </Field>
        </div>

        {editing ? (
          <>
            <ul className="flex flex-wrap gap-1.5 border-t border-line pt-3">
              {roomBeds.map((b) => (
                <li
                  key={b.id}
                  className={
                    b.studentId === null
                      ? 'rounded-lg border border-dashed border-graphite-950/20 px-2 py-0.5 font-mono text-[11px] text-text-dim'
                      : 'rounded-lg border border-mint-600/30 bg-mint-400/10 px-2 py-0.5 font-mono text-[11px] text-mint-700'
                  }
                >
                  {b.number}
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed text-text-dim">
              Sig‘imni oshirilsa, yangi bo‘sh joylar qo‘shiladi. Kamaytirishda esa band joylar hech qachon
              o‘chirilmaydi — xato bo‘lsa, avval talabani ko‘chiring.
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-2"
              onClick={() => {
                if (report(deleteRoom(editing.id), ['O‘chirildi', `${editing.number}-xona o‘chirildi.`])) onClose();
              }}
            >
              Xonani o‘chirish
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setNumber(String(freeNumber()))}>
              Bo‘sh raqamni tanlash
            </Button>
            <p className="text-[11px] leading-relaxed text-text-dim">
              Xona {floors.find((f) => f.id === parentFloorId)?.number ?? '—'}-qavatga qo‘shiladi, joylar esa
              avtomatik yaratiladi.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
