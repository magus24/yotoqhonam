import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Student } from '../../data/types';
import { useDormStore } from '../../store/dormStore';
import {
  useDormBeds,
  useDormitories,
  useDormitory,
  useDormRooms,
  useFloors,
  usePlacements,
  useStudents,
} from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { KeyTag } from '../../components/ui/Primitives';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/utils';
import { Field, Row, report } from './ui';

/* -------------------------------------------------------------------------- */
/* Dormitory — the readiness criterion "create a residence"                     */
/* -------------------------------------------------------------------------- */

export function DormitoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dormitories = useDormitories();
  const current = useDormitory();
  const updateDormitory = useDormStore((s) => s.updateDormitory);
  const addDormitory = useDormStore((s) => s.addDormitory);
  const deleteDormitory = useDormStore((s) => s.deleteDormitory);

  const [mode, setMode] = useState<'create' | 'edit'>('edit');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // With a single residence the modal starts as its editor; with several it
  // starts in create mode and lists the others. Either way the editor offers a
  // way into create mode, otherwise a second residence could never be added.
  useEffect(() => {
    if (!open) return;
    if (dormitories.length <= 1) {
      setMode('edit');
      setEditingId(current?.id ?? null);
      setName(current?.name ?? '');
      setAddress(current?.address ?? '');
    } else {
      setMode('create');
      setEditingId(null);
      setName('');
      setAddress('');
    }
  }, [open, dormitories.length, current]);

  const save = () => {
    const ok =
      mode === 'edit' && editingId
        ? report(updateDormitory(editingId, { name, address }), [
            'Saqlandi',
            'Yotoqxona ma’lumotlari yangilandi.',
          ])
        : report(addDormitory({ name, address }), [
            'Yotoqxona qo‘shildi',
            `${name} — 1- va 2-qavatlar bilan. Endi xona qo‘shing.`,
          ]);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Yotoqxona ma’lumotlari' : 'Yotoqxona qo‘shish'}
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
      {mode === 'create' ? (
        <div className="mb-5">
          <p className="engrave">Mavjud yotoqxonalar</p>
          <ul className="mt-2 space-y-1">
            {dormitories.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => {
                    setMode('edit');
                    setEditingId(d.id);
                    setName(d.name);
                    setAddress(d.address);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-graphite-950/10 px-3 py-2 text-left text-sm transition-colors hover:border-graphite-950/25"
                >
                  <span className="min-w-0 flex-1 truncate text-text">{d.name}</span>
                  <span className="truncate font-mono text-[11px] text-text-dim">{d.address}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-text-dim">
            <Plus className="size-3" /> Yangi yotoqxona qo‘shish uchun pastdagi maydonlarni to‘ldiring.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <Field label="Nomi">
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Yotoqxonam Residence" />
        </Field>
        <Field label="Manzil">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="field"
            placeholder="Universitet ko‘chasi 14, Toshkent"
          />
        </Field>
      </div>

      {mode === 'edit' && dormitories.length <= 1 ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          icon={<Plus className="size-3.5" />}
          onClick={() => {
            setMode('create');
            setEditingId(null);
            setName('');
            setAddress('');
          }}
        >
          Yana bitta yotoqxona qo‘shish
        </Button>
      ) : null}

      {mode === 'edit' && editingId !== null && dormitories.length > 1 ? (
        <Button
          variant="danger"
          size="sm"
          className="mt-6"
          onClick={() => {
            if (report(deleteDormitory(editingId), ['O‘chirildi', 'Yotoqxona va uning xonalari o‘chirildi.'])) onClose();
          }}
        >
          Yotoqxonani o‘chirish
        </Button>
      ) : null}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Student                                                                      */
/* -------------------------------------------------------------------------- */

export function StudentModal({
  state,
  onClose,
}: {
  state: { open: boolean; student: Student | null };
  onClose: () => void;
}) {
  const addStudent = useDormStore((s) => s.addStudent);
  const updateStudent = useDormStore((s) => s.updateStudent);

  const editing = state.student;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    if (!state.open) return;
    setName(editing?.name ?? '');
    setPhone(editing?.phone ?? '');
    setStudentId(editing?.studentId ?? '');
    setUniversity(editing?.university ?? '');
    setFaculty(editing?.faculty ?? '');
    setCourse(editing?.course ? String(editing.course) : '');
  }, [state.open, editing]);

  const save = () => {
    const payload = {
      name,
      phone,
      studentId,
      university,
      faculty,
      course: course ? Number(course) : undefined,
    };
    const ok = editing
      ? report(updateStudent(editing.id, payload), ['Saqlandi', `${name} ma’lumotlari yangilandi.`])
      : report(addStudent(payload), ['Qo‘shildi', `${name} ro‘yxatga olindi. Endi joy bering.`]);
    if (ok) onClose();
  };

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={editing ? 'Talaba ma’lumotlari' : 'Yangi talaba'}
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
        <Field label="Ism-familya" hint="Kamida 3 ta belgi.">
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Aziz Karimov" />
        </Field>
        <Row>
          <Field label="Telefon">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" placeholder="+998 90 123 45 67" />
          </Field>
          <Field label="Talaba ID">
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} className="field" placeholder="221045" />
          </Field>
        </Row>
        <Field label="Universitet">
          <input value={university} onChange={(e) => setUniversity(e.target.value)} className="field" placeholder="TDU" />
        </Field>
        <Row>
          <Field label="Fakultet">
            <input value={faculty} onChange={(e) => setFaculty(e.target.value)} className="field" placeholder="Axborot texnologiyalari" />
          </Field>
          <Field label="Kurs">
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="field"
              inputMode="numeric"
              placeholder="2"
            />
          </Field>
        </Row>
        {editing ? (
          <p className="text-[11px] leading-relaxed text-text-dim">
            Joy o‘zgartirish uchun “Ko‘chirish” tugmasidan foydalaning — avvalgi joy avtomatik bo‘shaydi.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Move / assign — the whole bed list, with occupancy visible                    */
/* -------------------------------------------------------------------------- */

export function MoveModal({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const beds = useDormBeds();
  const rooms = useDormRooms();
  const floors = useFloors();
  const students = useStudents();
  const placements = usePlacements();
  const assignStudent = useDormStore((s) => s.assignStudent);
  const moveStudent = useDormStore((s) => s.moveStudent);
  const evictStudent = useDormStore((s) => s.evictStudent);

  const current = student ? placements.get(student.id) : undefined;

  const take = (bedId: string) => {
    if (!student) return;
    const ok = current
      ? report(moveStudent(student.id, bedId), ['Ko‘chirildi', `${student.name} yangi joyga o‘tkazildi.`])
      : report(assignStudent(student.id, bedId), ['Joy berildi', `${student.name} endi joy band qildi.`]);
    if (ok) onClose();
  };

  const title = current ? 'Ko‘chirish' : 'Joy berish';

  return (
    <Modal open={Boolean(student)} onClose={onClose} title={student ? `${title}: ${student.name}` : title}>
      {student ? (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-graphite-950/10 p-3">
            <KeyTag initials={student.initials} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text">{student.name}</p>
              <p className="truncate font-mono text-[11px] text-text-dim">
                {current ? `hozir: ${current.room?.number ?? '—'} · ${current.bed.number}-joy` : 'hozir joyi yo‘q'}
              </p>
            </div>
            {current ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (report(evictStudent(student.id), ['Bo‘shatildi', `${student.name} endi joyga tegishli emas.`])) onClose();
                }}
              >
                Bo‘shatish
              </Button>
            ) : null}
          </div>

          <p className="engrave mt-6">Xonalar va joylar</p>
          <div className="mt-3 space-y-4">
            {floors.map((floor) => {
              const floorRooms = rooms.filter((r) => r.floorId === floor.id);
              if (floorRooms.length === 0) return null;
              return (
                <div key={floor.id}>
                  <p className="font-mono text-[11px] text-text-dim">
                    {floor.number}-qavat · {floor.name}
                  </p>
                  <div className="mt-2 space-y-2">
                    {floorRooms.map((room) => {
                      const roomBeds = beds
                        .filter((b) => b.roomId === room.id)
                        .sort((a, b) => a.number - b.number);
                      return (
                        <div key={room.id} className="flex flex-wrap items-center gap-1.5">
                          <span className="plate shrink-0 px-1.5 py-0.5 text-[11px]">{room.number}</span>
                          {roomBeds.map((bed) => {
                            const holder = bed.studentId ? students.find((s) => s.id === bed.studentId) : null;
                            const isMine = bed.studentId === student.id;
                            const full = Boolean(holder) && !isMine;
                            return (
                              <button
                                key={bed.id}
                                type="button"
                                disabled={full}
                                onClick={() => take(bed.id)}
                                title={holder ? `${holder.name} band qilgan` : `${bed.number}-joy bo‘sh`}
                                className={cn(
                                  'rounded-lg border px-2 py-1 text-[11px] transition-colors',
                                  isMine
                                    ? 'border-mint-600/45 bg-mint-400/15 text-mint-700'
                                    : full
                                      ? 'cursor-not-allowed border-graphite-950/10 text-text-dim'
                                      : 'border-dashed border-mint-600/40 text-mint-700 hover:bg-mint-400/10',
                                )}
                              >
                                <span className="font-mono tabular-nums">{bed.number}</span>
                                <span className="ml-1">
                                  {isMine ? 'hozirgi' : holder ? holder.name.split(' ')[0] : 'bo‘sh'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-text-dim">
            Band joylar o‘chirilgan. Bo‘sh joyni tanlang — talaba shu yerga ko‘chiriladi va avvalgi joyi
            bo‘shaydi.
          </p>
        </>
      ) : null}
    </Modal>
  );
}
