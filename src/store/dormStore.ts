import { create } from 'zustand';
import type {
  DemoState,
  Dormitory,
  Duty,
  DutyReport,
  Floor,
  ID,
  Room,
  Student,
} from '../data/types';
import { createInitialDemoState, buildBeds, DEMO_QUEUE, makeDutiesForDay } from '../data/mock';
import { getNextDutyRoom } from '../data/dutyQueue';
import * as reg from '../data/registry';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import { initialsOf, todayISO, uid } from '../lib/utils';

const SCHEMA_VERSION = 2;

/**
 * v1 held only the duty slice and kept the residence hierarchy in module
 * constants. v2 moves dormitories/floors/rooms/beds/students into the persisted
 * registry, so admin edits survive a reload. The duty slice is carried across
 * untouched; only the *new* registry is seeded.
 */
function migrate(stored: unknown): DemoState | null {
  if (!stored || typeof stored !== 'object') return null;
  const v = stored as Partial<DemoState>;
  if (!Array.isArray(v.duties)) return null;

  const seed = createInitialDemoState();
  if (v.version === SCHEMA_VERSION && Array.isArray(v.beds) && Array.isArray(v.students)) {
    return { ...(stored as DemoState) };
  }

  return {
    ...seed,
    currentUserId: v.currentUserId ?? seed.currentUserId,
    queue: Array.isArray(v.queue) && v.queue.length > 0 ? v.queue : seed.queue,
    activeDutyId: v.activeDutyId ?? null,
    duties: v.duties,
    reports: Array.isArray(v.reports) ? v.reports : [],
    skippedRoomIds: Array.isArray(v.skippedRoomIds) ? v.skippedRoomIds : [],
  };
}

/**
 * A new calendar day needs a fresh rota, but it must NOT reset the registry —
 * the old loader re-seeded the whole state, which was harmless while the
 * residence data lived in constants and destructive now that the warden edits it.
 */
function withTodayDuties(state: DemoState): DemoState {
  const today = todayISO();
  if (state.duties.some((d) => d.date === today)) return state;

  const ring = state.queue.filter((id) => state.rooms.some((r) => r.id === id));
  const duties = [...state.duties, ...makeDutiesForDay(ring)];
  const next = duties.find((d) => d.date === today && d.status === 'pending') ?? null;
  return { ...state, duties, activeDutyId: next ? next.id : state.activeDutyId };
}

/**
 * `persist` only runs when an action fires, so without an explicit flush a
 * migrated payload (or a newly rolled-over day) would live in memory only and
 * be recomputed from the stale blob on every single reload. Write once whenever
 * the stored shape no longer matches what we just loaded.
 */
function loadState(): DemoState {
  const raw = readJSON<unknown>(STORAGE_KEYS.demoState, null);
  const stored = raw as Partial<DemoState> | null;
  const state = withTodayDuties(migrate(raw) ?? createInitialDemoState());

  const staleShape =
    !stored ||
    stored.version !== SCHEMA_VERSION ||
    !Array.isArray(stored.rooms) ||
    !Array.isArray(stored.beds) ||
    !Array.isArray(stored.students);
  // Compare against what is *stored*, not against `state` — the rolled-over
  // state always contains today by construction, so testing it would never
  // detect a rollover.
  const staleDay =
    !Array.isArray(stored?.duties) || !stored.duties.some((d) => d.date === todayISO());
  if (staleShape || staleDay) saveState(state);

  return state;
}

function saveState(state: DemoState) {
  writeJSON(STORAGE_KEYS.demoState, state);
}

export interface DormStore extends DemoState {
  activeDuty: Duty | null;
  activeRoomId: ID | null;
  reportForActiveDuty: DutyReport | null;

  queueRoomIds: () => ID[];
  nextRoomId: () => ID | null;
  dutyForRoom: (roomId: ID, date?: string) => Duty | null;
  reportsForRoom: (roomId: ID) => DutyReport[];

  setActiveDuty: (dutyId: ID | null) => void;
  toggleChecklistItem: (dutyId: ID, itemId: string) => void;
  startDuty: (dutyId: ID) => void;
  completeDuty: (dutyId: ID, photoUrl: string, note: string) => void;
  resetDemo: () => void;

  /* ------------------------------- registry ------------------------------ */

  addDormitory: (input: { name: string; address: string }) => reg.Result<ID>;
  updateDormitory: (id: ID, patch: { name: string; address: string }) => reg.Result;
  deleteDormitory: (id: ID) => reg.Result;
  setActiveDormitory: (id: ID) => void;

  addFloor: (input: { dormitoryId: ID; number: number; name: string }) => reg.Result<ID>;
  updateFloor: (id: ID, patch: { number: number; name: string }) => reg.Result;
  deleteFloor: (id: ID) => reg.Result;

  addRoom: (input: { floorId: ID; number: string; capacity: number }) => reg.Result<ID>;
  updateRoom: (id: ID, patch: { number: string; capacity: number }) => reg.Result;
  deleteRoom: (id: ID) => reg.Result;

  addStudent: (input: {
    name: string;
    phone?: string;
    studentId?: string;
    university?: string;
    faculty?: string;
    course?: number;
  }) => reg.Result<ID>;
  updateStudent: (id: ID, patch: Partial<Omit<Student, 'id' | 'initials'>>) => reg.Result;
  deleteStudent: (id: ID) => reg.Result;
  assignStudent: (studentId: ID, bedId: ID) => reg.Result;
  moveStudent: (studentId: ID, bedId: ID) => reg.Result;
  evictStudent: (studentId: ID) => reg.Result;
}

const persist = (s: DemoState) => {
  saveState({
    version: SCHEMA_VERSION,
    currentUserId: s.currentUserId,
    queue: s.queue,
    activeDutyId: s.activeDutyId,
    duties: s.duties,
    reports: s.reports,
    skippedRoomIds: s.skippedRoomIds,
    dormitories: s.dormitories,
    activeDormitoryId: s.activeDormitoryId,
    floors: s.floors,
    rooms: s.rooms,
    beds: s.beds,
    students: s.students,
    assignmentHistory: s.assignmentHistory,
  });
};

/** Applies a registry patch, persists, and returns it for caller reporting. */
function commit(set: (partial: Partial<DormStore>) => void, get: () => DormStore, patch: Partial<DormStore>) {
  set(patch);
  persist(get());
}

export const useDormStore = create<DormStore>((set, get) => ({
  ...loadState(),

  activeDuty: null,
  activeRoomId: null,
  reportForActiveDuty: null,

  queueRoomIds: () => get().queue,

  nextRoomId: () => {
    const { queue, activeDutyId, duties } = get();
    const current = duties.find((d) => d.id === activeDutyId);
    if (!current) return null;
    // The ring only needs ordering, so identity stubs are enough here.
    const ring = queue.map((id) => ({ id }) as Room);
    return getNextDutyRoom(current.roomId, ring)?.id ?? null;
  },

  dutyForRoom: (roomId, date = todayISO()) => {
    const { duties } = get();
    return duties.find((d) => d.roomId === roomId && d.date === date) ?? null;
  },

  reportsForRoom: (roomId) => {
    const { duties, reports } = get();
    const dutyIds = new Set(duties.filter((d) => d.roomId === roomId).map((d) => d.id));
    return reports
      .filter((r) => dutyIds.has(r.dutyId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  setActiveDuty: (dutyId) => {
    set({ activeDutyId: dutyId });
    persist(get());
  },

  toggleChecklistItem: (dutyId, itemId) => {
    const duties = get().duties.map((d) => {
      if (d.id !== dutyId) return d;
      const has = d.completedItems.includes(itemId);
      return {
        ...d,
        completedItems: has ? d.completedItems.filter((i) => i !== itemId) : [...d.completedItems, itemId],
        status: (has ? 'in_progress' : 'awaiting_report') as Duty['status'],
      };
    });
    set({ duties });
    persist(get());
  },

  startDuty: (dutyId) => {
    const duties = get().duties.map((d) =>
      d.id === dutyId ? { ...d, status: 'in_progress' as const, startedAt: d.startedAt ?? new Date().toISOString() } : d,
    );
    set({ duties, activeDutyId: dutyId });
    persist(get());
  },

  completeDuty: (dutyId, photoUrl, note) => {
    const state = get();
    const target = state.duties.find((d) => d.id === dutyId);
    if (!target) return;

    const report: DutyReport = {
      id: uid('rep'),
      dutyId,
      photoUrl,
      note,
      createdAt: new Date().toISOString(),
    };

    const duties = state.duties.map((d) =>
      d.id === dutyId
        ? {
            ...d,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            completedItems: d.checklist.map((c) => c.id),
          }
        : d,
    );

    // The ring advances to the room *after* the one that just finished, so the
    // completed room lands at the back and the head is always the next duty.
    // Rotating from the target's own index keeps the cycle intact
    // (205 -> 206 -> 207 -> 204 -> 205) instead of walking backwards.
    const at = state.queue.indexOf(target.roomId);
    const queue =
      state.queue.length > 1 && at >= 0
        ? [...state.queue.slice(at + 1), ...state.queue.slice(0, at + 1)]
        : state.queue.length > 1
          ? state.queue
          : state.queue.length > 0
            ? state.queue
            : [...DEMO_QUEUE];

    const nextDuty = duties.find((d) => d.roomId === queue[0] && d.date === todayISO()) ?? null;

    set({
      duties,
      reports: [report, ...state.reports],
      queue,
      activeDutyId: nextDuty ? nextDuty.id : null,
    });
    persist(get());
  },

  resetDemo: () => {
    const fresh = createInitialDemoState();
    set({ ...fresh });
    persist(fresh);
  },

  /* ------------------------------- registry ------------------------------ */

  addDormitory: (input) => {
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: 'Yotoqxona nomi kamida 2 ta belgidan iborat bo‘lsin.' };
    const s = get();
    const id = uid('dorm');
    const dormitory: Dormitory = { id, name, address: input.address.trim() };
    commit(set, get, {
      dormitories: [...s.dormitories, dormitory],
      activeDormitoryId: id,
      floors: [...s.floors, ...[1, 2].map((n) => ({ id: uid('floor'), dormitoryId: id, number: n, name: `Floor ${n}` }))],
    });
    return { ok: true, value: id };
  },

  updateDormitory: (id, patch) => {
    const name = patch.name.trim();
    if (name.length < 2) return { ok: false, error: 'Yotoqxona nomi kamida 2 ta belgidan iborat bo‘lsin.' };
    const s = get();
    if (!s.dormitories.some((d) => d.id === id)) return { ok: false, error: 'Yotoqxona topilmadi.' };
    commit(set, get, {
      dormitories: s.dormitories.map((d) =>
        d.id === id ? { ...d, name, address: patch.address.trim() } : d,
      ),
    });
    return { ok: true };
  },

  deleteDormitory: (id) => {
    const s = get();
    if (s.dormitories.length <= 1) return { ok: false, error: 'Kamida bitta yotoqxona qolishi kerak.' };
    // Count the people *inside* the residence being dropped — not the ones who
    // live elsewhere, who would otherwise block every deletion.
    const floorIds = new Set(s.floors.filter((f) => f.dormitoryId === id).map((f) => f.id));
    const doomed = s.rooms.filter((r) => floorIds.has(r.floorId));
    const roomIds = new Set(doomed.map((r) => r.id));
    const held = s.beds.filter((b) => roomIds.has(b.roomId) && b.studentId !== null).length;
    if (held > 0) return { ok: false, error: `Avval ${held} nafar talabani bo‘shating.` };
    const dormitories = s.dormitories.filter((d) => d.id !== id);
    commit(set, get, {
      dormitories,
      floors: s.floors.filter((f) => f.dormitoryId !== id),
      rooms: s.rooms.filter((r) => !roomIds.has(r.id)),
      beds: s.beds.filter((b) => !roomIds.has(b.roomId)),
      queue: s.queue.filter((q) => !roomIds.has(q)),
      // Students are not owned by a dormitory — an unassigned student is a
      // waiting-list record, so dropping the structure must not drop people.
      activeDormitoryId: s.activeDormitoryId === id ? dormitories[0].id : s.activeDormitoryId,
    });
    return { ok: true };
  },

  setActiveDormitory: (id) => {
    if (!get().dormitories.some((d) => d.id === id)) return;
    commit(set, get, { activeDormitoryId: id });
  },

  addFloor: (input) => {
    const s = get();
    const check = reg.validateFloorNumber(s.floors, input.dormitoryId, input.number);
    if (!check.ok) return check;
    const id = uid('floor');
    const floor: Floor = {
      id,
      dormitoryId: input.dormitoryId,
      number: input.number,
      name: input.name.trim() || `Floor ${input.number}`,
    };
    commit(set, get, { floors: [...s.floors, floor] });
    return { ok: true, value: id };
  },

  updateFloor: (id, patch) => {
    const s = get();
    const current = s.floors.find((f) => f.id === id);
    if (!current) return { ok: false, error: 'Qavat topilmadi.' };
    const check = reg.validateFloorNumber(s.floors, current.dormitoryId, patch.number, id);
    if (!check.ok) return check;
    commit(set, get, {
      floors: s.floors.map((f) =>
        f.id === id ? { ...f, number: patch.number, name: patch.name.trim() || `Floor ${patch.number}` } : f,
      ),
    });
    return { ok: true };
  },

  deleteFloor: (id) => {
    const s = get();
    const check = reg.canDeleteFloor(s.rooms, id);
    if (!check.ok) return check;
    commit(set, get, { floors: s.floors.filter((f) => f.id !== id) });
    return { ok: true };
  },

  addRoom: (input) => {
    const s = get();
    const check = reg.validateRoomNumber(s.rooms, input.floorId, input.number);
    if (!check.ok) return check;
    const cap = reg.validateCapacity(input.capacity, 0);
    if (!cap.ok) return cap;
    const id = uid('room');
    const room: Room = {
      id,
      floorId: input.floorId,
      number: input.number.trim(),
      capacity: input.capacity,
      ...reg.nextRoomSlot(s.rooms, input.floorId),
    };
    commit(set, get, {
      rooms: [...s.rooms, room],
      beds: [...s.beds, ...buildBeds([room])],
    });
    return { ok: true, value: id };
  },

  updateRoom: (id, patch) => {
    const s = get();
    const current = s.rooms.find((r) => r.id === id);
    if (!current) return { ok: false, error: 'Xona topilmadi.' };
    const number = reg.validateRoomNumber(s.rooms, current.floorId, patch.number, id);
    if (!number.ok) return number;
    const occupied = reg.occupiedCount(s.beds, id);
    const capacity = reg.validateCapacity(patch.capacity, occupied);
    if (!capacity.ok) return capacity;

    // Growing capacity appends vacant beds. Shrinking may only remove beds from
    // the end of the run, so an occupied high-numbered bed is never silently
    // destroyed — the caller is told to free a place first.
    const roomBeds = reg.bedsOfRoom(s.beds, id);
    let beds = s.beds;
    if (roomBeds.length !== patch.capacity) {
      if (patch.capacity < roomBeds.length && roomBeds.slice(patch.capacity).some((b) => b.studentId !== null)) {
        return {
          ok: false,
          error: `${patch.capacity + 1}-joy va undan katta joylar band. Avval ularni bo‘shating.`,
        };
      }
      const keep = new Set(roomBeds.slice(0, patch.capacity).map((b) => b.id));
      beds = s.beds.filter((b) => b.roomId !== id || keep.has(b.id));
      for (let n = keep.size + 1; n <= patch.capacity; n += 1) {
        beds = [...beds, { id: uid('bed'), roomId: id, number: n, studentId: null }];
      }
    }

    commit(set, get, {
      rooms: s.rooms.map((r) =>
        r.id === id ? { ...r, number: patch.number.trim(), capacity: patch.capacity } : r,
      ),
      beds,
    });
    return { ok: true };
  },

  deleteRoom: (id) => {
    const s = get();
    const check = reg.canDeleteRoom(s.beds, id);
    if (!check.ok) return check;
    commit(set, get, {
      rooms: s.rooms.filter((r) => r.id !== id),
      beds: s.beds.filter((b) => b.roomId !== id),
      queue: s.queue.filter((q) => q !== id),
      activeDutyId: s.duties.some((d) => d.id === s.activeDutyId && d.roomId === id) ? null : s.activeDutyId,
    });
    return { ok: true };
  },

  addStudent: (input) => {
    const s = get();
    const name = reg.validateStudentName(input.name);
    if (!name.ok) return name;
    const student: Student = {
      id: uid('stu'),
      name: input.name.trim(),
      initials: initialsOf(input.name),
      phone: input.phone?.trim() || undefined,
      studentId: input.studentId?.trim() || undefined,
      university: input.university?.trim() || undefined,
      faculty: input.faculty?.trim() || undefined,
      course: input.course,
      status: 'active',
    };
    commit(set, get, { students: [...s.students, student] });
    return { ok: true, value: student.id };
  },

  updateStudent: (id, patch) => {
    const s = get();
    if (!s.students.some((st) => st.id === id)) return { ok: false, error: 'Talaba topilmadi.' };
    const name = reg.validateStudentName(patch.name ?? s.students.find((st) => st.id === id)!.name);
    if (!name.ok) return name;
    commit(set, get, {
      students: s.students.map((st) => {
        if (st.id !== id) return st;
        const merged = { ...st, ...patch };
        return {
          ...merged,
          name: merged.name.trim(),
          initials: initialsOf(merged.name),
          phone: merged.phone?.trim() || undefined,
          studentId: merged.studentId?.trim() || undefined,
          university: merged.university?.trim() || undefined,
          faculty: merged.faculty?.trim() || undefined,
        };
      }),
    });
    return { ok: true };
  },

  deleteStudent: (id) => {
    const s = get();
    if (reg.bedOfStudent(s.beds, id)) {
      return { ok: false, error: 'Avval talabani bo‘shating.' };
    }
    commit(set, get, { students: s.students.filter((st) => st.id !== id) });
    return { ok: true };
  },

  assignStudent: (studentId, bedId) => {
    const s = get();
    if (!s.students.some((st) => st.id === studentId)) return { ok: false, error: 'Talaba topilmadi.' };
    // A student can only hold one place. Assigning while they already have a bed
    // would leave two beds pointing at the same person and break every occupancy
    // count, so the caller must go through moveStudent instead.
    if (reg.bedOfStudent(s.beds, studentId)) {
      return { ok: false, error: 'Talaba allaqachon joyda turibdi. Ko‘chirishdan foydalaning.' };
    }
    const check = reg.validateBedTake(s.beds, bedId, studentId);
    if (!check.ok) return check;
    const bed = s.beds.find((b) => b.id === bedId)!;
    const now = new Date().toISOString();
    commit(set, get, {
      beds: s.beds.map((b) => (b.id === bedId ? { ...b, studentId } : b)),
      students: s.students.map((st) => (st.id === studentId ? { ...st, status: 'active' as const } : st)),
      assignmentHistory: [
        ...s.assignmentHistory,
        {
          id: uid('asg'),
          studentId,
          roomId: bed.roomId,
          bedId,
          bedNumber: bed.number,
          assignedAt: now,
          endedAt: null,
          reason: 'assigned' as const,
        },
      ],
    });
    return { ok: true };
  },

  moveStudent: (studentId, bedId) => {
    const s = get();
    const from = reg.bedOfStudent(s.beds, studentId);
    if (!from) return { ok: false, error: 'Talaba hozir joyda turibdi.' };
    if (from.id === bedId) return { ok: true };
    const check = reg.validateBedTake(s.beds, bedId, studentId);
    if (!check.ok) return check;
    const to = s.beds.find((b) => b.id === bedId)!;
    const now = new Date().toISOString();
    commit(set, get, {
      beds: s.beds.map((b) =>
        b.id === from.id ? { ...b, studentId: null } : b.id === bedId ? { ...b, studentId } : b,
      ),
      assignmentHistory: [
        ...s.assignmentHistory.map((e) =>
          e.studentId === studentId && e.endedAt === null ? { ...e, endedAt: now, reason: 'moved' as const } : e,
        ),
        {
          id: uid('asg'),
          studentId,
          roomId: to.roomId,
          bedId,
          bedNumber: to.number,
          assignedAt: now,
          endedAt: null,
          reason: 'moved' as const,
        },
      ],
    });
    return { ok: true };
  },

  evictStudent: (studentId) => {
    const s = get();
    const bed = reg.bedOfStudent(s.beds, studentId);
    if (!bed) return { ok: false, error: 'Talaba allaqachon joyda yo‘q.' };
    const now = new Date().toISOString();
    commit(set, get, {
      beds: s.beds.map((b) => (b.id === bed.id ? { ...b, studentId: null } : b)),
      students: s.students.map((st) => (st.id === studentId ? { ...st, status: 'moved_out' as const } : st)),
      assignmentHistory: [
        ...s.assignmentHistory.map((e) =>
          e.studentId === studentId && e.endedAt === null ? { ...e, endedAt: now, reason: 'moved_out' as const } : e,
        ),
        {
          id: uid('asg'),
          studentId,
          roomId: bed.roomId,
          bedId: bed.id,
          bedNumber: bed.number,
          assignedAt: now,
          endedAt: now,
          reason: 'moved_out' as const,
        },
      ],
    });
    return { ok: true };
  },
}));

/**
 * Selectors kept outside the component tree so three.js and React share one
 * subscription instead of re-rendering on every store write.
 */
export const selectActiveDuty = (s: DormStore): Duty | null =>
  s.duties.find((d) => d.id === s.activeDutyId) ?? null;

export const selectActiveRoomId = (s: DormStore): ID | null => selectActiveDuty(s)?.roomId ?? null;

/* -------------------------------------------------------------------------- */
/* Registry selectors                                                           */
/*                                                                             */
/* Only element-returning selectors live here: a selector that builds a new      */
/* array or object breaks useSyncExternalStore's identity check and re-renders  */
/* in a loop. Derived lists belong in useRegistry.ts, behind useMemo.           */
/* -------------------------------------------------------------------------- */

export const selectDormitory = (s: DormStore): Dormitory | null =>
  s.dormitories.find((d) => d.id === s.activeDormitoryId) ?? s.dormitories[0] ?? null;
