import { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { Floor, ID, Room, Student } from '../data/types';
import { getNextDutyRoom } from '../data/dutyQueue';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import { useDormHistoryRooms, useDormitories, useDormitory, useDormOccupancy, useDutyRing, useUserRoom } from '../store/useRegistry';
import { Button, ButtonLink } from '../components/ui/Button';
import { EmptyState, SectionTitle, Stat } from '../components/ui/Primitives';
import { toast } from '../components/ui/Toast';
import { cn, todayISO } from '../lib/utils';
import { StudentsTab } from './admin/StudentsTab';
import { BedsTab } from './admin/BedsTab';
import { RoomsTab } from './admin/RoomsTab';
import { FloorsTab } from './admin/FloorsTab';
import { DutiesTab, ReportsTab, StackTab } from './admin/DutyTabs';
import { DormitoryModal, MoveModal, StudentModal } from './admin/Modals';
import { FloorModal, RoomModal } from './admin/RoomModals';

const TABS = [
  { id: 'students', label: 'Talabalar', hint: 'Students' },
  { id: 'beds', label: 'Joylar', hint: 'Beds' },
  { id: 'rooms', label: 'Xonalar', hint: 'Rooms' },
  { id: 'floors', label: 'Qavatlar', hint: 'Floors' },
  { id: 'duty', label: 'Navbatchilik', hint: 'Duty rota' },
  { id: 'reports', label: 'Hisobotlar', hint: 'Reports' },
  { id: 'stack', label: 'Stack', hint: 'Build status' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Admin() {
  const user = useAuthStore((s) => s.user);
  const ownRoom = useUserRoom(user);

  const dormitories = useDormitories();
  const dormitory = useDormitory();
  const setActiveDormitory = useDormStore((s) => s.setActiveDormitory);
  const ring = useDutyRing();
  const { inScope } = useDormHistoryRooms();
  const occupancy = useDormOccupancy();
  const duties = useDormStore((s) => s.duties);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const resetDemo = useDormStore((s) => s.resetDemo);

  const [tab, setTab] = useState<Tab>('students');
  const [dormOpen, setDormOpen] = useState(false);
  const [student, setStudent] = useState<{ open: boolean; student: Student | null }>({
    open: false,
    student: null,
  });
  const [moving, setMoving] = useState<Student | null>(null);
  const [room, setRoom] = useState<{ open: boolean; room: Room | null; floorId: ID | null }>({
    open: false,
    room: null,
    floorId: null,
  });
  const [floor, setFloor] = useState<{ open: boolean; floor: Floor | null }>({ open: false, floor: null });

  const openStudent = (target: Student | null) => setStudent({ open: true, student: target });
  const openRoom = (target: Room | null, floorId: ID | null = null) =>
    setRoom({ open: true, room: target, floorId });

  const activeDuty = duties.find((d) => d.id === activeDutyId) ?? null;
  // The rotation is estate-wide, so the warden's cards count only the rooms of
  // the residence selected in the header.
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring.filter((r) => inScope(r.id)));
  const today = duties.filter((d) => d.date === todayISO() && inScope(d.roomId));
  const completed = today.filter((d) => d.status === 'completed').length;

  if (user && user.role !== 'admin') {
    return (
      <EmptyState
        as="h1"
        title="This area is for the warden"
        body={`You are signed in as a resident${ownRoom ? ` of room ${ownRoom.number}` : ''}. Sign in with the admin demo account to see the floor register.`}
        action={
          <ButtonLink to="/dashboard" variant="ghost" size="sm">
            Back to overview
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="engrave">Warden console</p>
          <h1 className="mt-2.5 font-display text-display-sm font-semibold leading-[1] text-text">
            {dormitory?.name ?? 'Yotoqxona'}
          </h1>
          <p className="mt-2 truncate text-sm text-text-mist">{dormitory?.address || 'Manzil kiritilmagan'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dormitories.length > 1 ? (
            <label className="flex items-center gap-2 text-xs text-text-mist">
              <Building2 aria-hidden className="size-3.5" />
              <span className="sr-only">Active residence</span>
              <select
                value={dormitory?.id ?? ''}
                onChange={(e) => setActiveDormitory(e.target.value)}
                className="field w-auto py-1.5 text-xs"
              >
                {dormitories.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setDormOpen(true)}>
            Yotoqxona
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetDemo();
              toast.success('Demo reset', 'The registry and duties are back to their starting state.');
            }}
          >
            Reset demo data
          </Button>
          {user?.role === 'admin' ? (
            <Button
              size="sm"
              onClick={() => {
                const link = `${window.location.origin}${window.location.pathname}#/login`;
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(link).then(
                    () => toast.info('Demo link copied', link),
                    () => toast.info('Demo link', link),
                  );
                } else {
                  toast.info('Demo link', link);
                }
              }}
            >
              Copy demo link
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Yotoqxona" value={occupancy.rooms ? `${occupancy.rooms} xona` : '—'} sub={`${dormitories.length} registered`} />
        <Stat
          label="Joylar"
          value={`${occupancy.occupied}/${occupancy.capacity}`}
          sub={occupancy.free > 0 ? `${occupancy.free} bo‘sh joy` : 'butun sig‘im band'}
        />
        <Stat
          label="Navbatchilik"
          value={`${completed}/${today.length}`}
          sub={
            nextRoom
              ? `next: room ${nextRoom.number}`
              : today.length > 0
                ? 'ring complete today'
                : 'no duty records yet'
          }
        />
        <Stat label="Talabalar" value={occupancy.occupied} sub="joyda turibdi" />
      </section>

      <SectionTitle
        hint={
          // SectionTitle renders its hint in a shrink-0 slot, so a long sentence
          // widens the page on a 390px viewport. Desktop-only copy avoids that.
          <span className="hidden text-text-dim sm:inline">
            Har bir o‘zgarish darhol saqlanadi va 3D rejada ko‘rinadi
          </span>
        }
      >
        Reestr
      </SectionTitle>

      <div
        className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Warden sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm transition-colors',
              tab === t.id
                ? 'border-mint-600/35 bg-mint-400/12 text-mint-700'
                : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-graphite-950',
            )}
          >
            {t.label}
            <span className="ml-2 font-mono text-[10px] text-text-dim">{t.hint}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'students' ? (
          <StudentsTab onAdd={() => openStudent(null)} onEdit={openStudent} onMove={setMoving} />
        ) : null}
        {tab === 'beds' ? <BedsTab onMove={setMoving} /> : null}
        {tab === 'rooms' ? <RoomsTab ring={ring} onOpen={(r) => openRoom(r)} onAdd={(floorId) => openRoom(null, floorId)} /> : null}
        {tab === 'floors' ? (
          <FloorsTab
            onAddFloor={() => setFloor({ open: true, floor: null })}
            onEditFloor={(f) => setFloor({ open: true, floor: f })}
            onOpenRoom={(r) => openRoom(r)}
          />
        ) : null}
        {tab === 'duty' ? <DutiesTab /> : null}
        {tab === 'reports' ? <ReportsTab /> : null}
        {tab === 'stack' ? <StackTab /> : null}
      </div>

      <DormitoryModal open={dormOpen} onClose={() => setDormOpen(false)} />
      <StudentModal state={student} onClose={() => setStudent({ open: false, student: null })} />
      <MoveModal student={moving} onClose={() => setMoving(null)} />
      <RoomModal
        state={room}
        onClose={() => setRoom({ open: false, room: null, floorId: null })}
      />
      <FloorModal state={floor} onClose={() => setFloor({ open: false, floor: null })} />
    </div>
  );
}
