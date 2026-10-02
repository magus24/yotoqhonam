import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';
import { getNextDutyRoom, resolveRoomState, ROOM_VISUALS, ROOM_STATE_ORDER } from '../data/dutyQueue';
import { roomsOfFloor } from '../data/registry';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import { useAllRooms, useDutyRing, useFloors, useRoomOccupant, useUserRoom } from '../store/useRegistry';
import { useReducedMotion } from '../hooks/useMedia';
import { DeferredFloorCanvas } from '../components/layout/AppShell';
import { Button, ButtonLink } from '../components/ui/Button';
import { RoomReadout } from '../components/three/FloorScene';
import { RotationDiagram } from '../components/route/RotationDiagram';
import { SectionTitle } from '../components/ui/Primitives';
import { cn } from '../lib/utils';

export default function FloorPage() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const duties = useDormStore((s) => s.duties);
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const reports = useDormStore((s) => s.reports);
  const queue = useDormStore((s) => s.queue);

  const [floorId, setFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showRotation, setShowRotation] = useState(false);

  const floors = useFloors();
  const allRooms = useAllRooms();
  const ownRoom = useUserRoom(user);

  /**
   * The plan shows one floor at a time. Default to the floor the signed-in
   * resident lives on, then to the first floor that actually has rooms, so a
   * freshly created floor never greets the warden with an empty corridor.
   */
  const floor =
    floors.find((f) => f.id === floorId) ??
    floors.find((f) => f.id === ownRoom?.floorId) ??
    floors.find((f) => allRooms.some((r) => r.floorId === f.id)) ??
    floors[0] ??
    null;

  const rooms = useMemo(
    () => (floor ? roomsOfFloor(allRooms, floor.id) : []),
    [allRooms, floor],
  );

  const activeDuty = useMemo(() => duties.find((d) => d.id === activeDutyId) ?? null, [duties, activeDutyId]);
  const ring = useDutyRing();
  const nextRoom = getNextDutyRoom(activeDuty?.roomId ?? '', ring);
  const selected = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);
  const selectedOccupants = useRoomOccupant(selected?.id ?? null);

  const stateFor = (id: string) =>
    resolveRoomState(id, {
      currentDutyRoomId: activeDuty?.roomId ?? null,
      nextDutyRoomId: nextRoom?.id ?? null,
      ownRoomId: ownRoom?.id ?? null,
      dutyStatus: activeDuty?.status ?? null,
    });

  const counts = ROOM_STATE_ORDER.map((s) => ({
    state: s,
    count: rooms.filter((r) => stateFor(r.id) === s).length,
  })).filter((c) => c.count > 0);

  const hasReport = reports.some((r) => r.dutyId === activeDuty?.id);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="engrave">
          {floor ? `Floor ${floor.number} · live plan` : 'Live plan'}
        </p>
        <h1 className="mt-2.5 font-display text-display-sm font-semibold leading-[1] text-text">
          Where the duty sits tonight
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {floors.length > 1 ? (
          <div
            className="no-scrollbar flex gap-1.5 overflow-x-auto"
            role="group"
            aria-label="Choose a floor"
          >
            {floors.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFloorId(f.id);
                  setSelectedRoomId(null);
                }}
                aria-pressed={f.id === floor?.id}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors',
                  f.id === floor?.id
                    ? 'border-mint-600/35 bg-mint-400/12 text-mint-700'
                    : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text',
                )}
              >
                {f.number}-qavat
              </button>
            ))}
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRotation((v) => !v)}
          aria-expanded={showRotation}
          icon={<Info className="size-3.5" strokeWidth={1.7} />}
        >
          {showRotation ? 'Hide rotation' : 'Show rotation'}
        </Button>
        {selected ? (
          <Button size="sm" onClick={() => navigate(`/room/${selected.id}`)} icon={<ChevronRight className="size-3.5" />}>
            Room {selected.number}
          </Button>
        ) : null}
      </div>
    </header>

      {showRotation ? (
        <div className="animate-fade-up">
          <RotationDiagram rooms={ring} activeRoomId={activeDuty?.roomId ?? null} reducedMotion={reduced} />
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="panel relative overflow-hidden">
          <div className="blueprint pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative h-[24rem] sm:h-[30rem] lg:h-[36rem]">
            <DeferredFloorCanvas
              rooms={rooms}
              queue={queue}
              activeRoomId={activeDuty?.roomId ?? null}
              nextRoomId={nextRoom?.id ?? null}
              ownRoomId={ownRoom?.id ?? null}
              dutyStatus={activeDuty?.status ?? null}
              selectedRoomId={selectedRoomId}
              onSelect={setSelectedRoomId}
              mode="explore"
              reducedMotion={reduced}
            />
          </div>

          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-graphite-950/[0.09] px-4 py-3.5 sm:px-5">
            {ROOM_STATE_ORDER.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] text-text-mist">
                <span className="size-1.5 rounded-full" style={{ background: ROOM_VISUALS[s].glow }} />
                {ROOM_VISUALS[s].label}
              </span>
            ))}
            <span className="ml-auto hidden text-[11px] text-text-dim sm:block">
              Drag to orbit · scroll to zoom · tap a room
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <RoomReadout
            room={selected}
            state={selected ? stateFor(selected.id) : 'neutral'}
            residents={selectedOccupants}
            onOpen={selected ? () => navigate(`/room/${selected.id}`) : undefined}
          />

          <div className="panel p-5">
            <SectionTitle>Floor summary</SectionTitle>
            <ul className="mt-4 space-y-2.5">
              {counts.map((c) => (
                <li key={c.state} className="flex items-center gap-3">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: ROOM_VISUALS[c.state].glow }} />
                  <span className="text-sm text-text-mist">{ROOM_VISUALS[c.state].label}</span>
                  <span className="ml-auto font-mono text-sm tabular-nums text-text">{c.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-graphite-950/[0.09] pt-3.5 text-xs leading-relaxed text-text-dim text-pretty">
              Colours come from one map, so the legend can never drift out of sync with the plan.
            </p>
          </div>

          <div className="panel p-5">
            <SectionTitle>Quick jumps</SectionTitle>
            <ul className="mt-4 space-y-1.5">
              {rooms.filter((r) => [activeDuty?.roomId, nextRoom?.id, ownRoom?.id].includes(r.id)).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedRoomId(r.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                      selectedRoomId === r.id ? 'bg-graphite-950/[0.07]' : 'hover:bg-graphite-950/[0.05]',
                    )}
                  >
                    <span className="plate px-1.5 py-0.5 text-[11px]">{r.number}</span>
                    <span className="text-xs text-text-mist">
                      {r.id === activeDuty?.roomId
                        ? 'On duty'
                        : r.id === nextRoom?.id
                          ? 'Next'
                          : 'Your room'}
                    </span>
                    <ChevronRight className="ml-auto size-3.5 text-text-dim" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {hasReport && activeDuty ? (
            <ButtonLink to="/duty/report" variant="ghost" size="sm" className="w-full">
              Open today’s report
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <section className="panel p-5 sm:p-6">
        <SectionTitle hint={<span className="font-mono text-xs text-text-dim">{rooms.length} rooms</span>}>
          All rooms
        </SectionTitle>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {rooms.map((room) => {
            const state = stateFor(room.id);
            const duty = duties.find((d) => d.roomId === room.id && d.status !== 'completed');
            return (
              <li key={room.id}>
                <button
                  onClick={() => setSelectedRoomId(room.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300',
                    selectedRoomId === room.id
                      ? 'border-graphite-950/25 bg-graphite-950/[0.08]'
                      : 'border-graphite-950/[0.09] hover:border-graphite-950/16 hover:bg-graphite-950/[0.04]',
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: ROOM_VISUALS[state].glow }}
                  />
                  <span className="font-mono text-sm tracking-[0.12em] text-text">{room.number}</span>
                  <span className="ml-auto truncate text-[11px] text-text-dim">
                    {duty ? duty.status.replace('_', ' ') : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        </section>
    </div>
  );
}
