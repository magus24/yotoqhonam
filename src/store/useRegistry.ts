import { useMemo } from 'react';
import { useDormStore } from './dormStore';
import {
  bedsOfRoom,
  isResidenceStaff,
  occupiedCount,
  occupancyOf,
  paymentSummaries,
  paymentsOfStudent,
  residentsOfRoom,
  roomsOfFloor,
  type Occupancy,
} from '../data/registry';
import type { Bed, Dormitory, Floor, ID, Payment, PaymentSummary, Room, Student, User } from '../data/types';

/**
 * Derived views over the registry.
 *
 * Every hook subscribes to the raw persisted slice (a stable reference) and
 * derives with `useMemo`, rather than passing a selector that builds a new
 * array — a fresh reference each render would break the store's identity check
 * and spin `useSyncExternalStore`.
 */

export function useDormitories(): Dormitory[] {
  return useDormStore((s) => s.dormitories);
}

export function useDormitory(): Dormitory | null {
  const dormitories = useDormitories();
  const activeId = useDormStore((s) => s.activeDormitoryId);
  return useMemo(() => dormitories.find((d) => d.id === activeId) ?? dormitories[0] ?? null, [dormitories, activeId]);
}

export function useFloors(): Floor[] {
  const floors = useDormStore((s) => s.floors);
  const activeId = useDormStore((s) => s.activeDormitoryId);
  return useMemo(
    () => floors.filter((f) => f.dormitoryId === activeId).sort((a, b) => a.number - b.number),
    [floors, activeId],
  );
}

export function useFloor(floorId: ID | null | undefined): Floor | null {
  const floors = useDormStore((s) => s.floors);
  return useMemo(() => (floorId ? floors.find((f) => f.id === floorId) ?? null : null), [floors, floorId]);
}

/** Rooms of a floor in numeric order. Pass no id for every room. */
export function useRooms(floorId?: ID | null): Room[] {
  const rooms = useDormStore((s) => s.rooms);
  return useMemo(
    () => (floorId ? roomsOfFloor(rooms, floorId) : [...rooms].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))),
    [rooms, floorId],
  );
}

/** Every room ordered by floor, then number — the canonical list for maps. */
export function useAllRooms(): Room[] {
  const rooms = useDormStore((s) => s.rooms);
  const floors = useDormStore((s) => s.floors);
  return useMemo(() => {
    const order = new Map(floors.map((f, i) => [f.id, i]));
    return [...rooms].sort(
      (a, b) =>
        (order.get(a.floorId) ?? 0) - (order.get(b.floorId) ?? 0) ||
        a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
  }, [rooms, floors]);
}

export function useRoom(roomId: ID | null | undefined): Room | null {
  const rooms = useDormStore((s) => s.rooms);
  return useMemo(() => (roomId ? rooms.find((r) => r.id === roomId) ?? null : null), [rooms, roomId]);
}

/**
 * Rooms of the *active* residence, ordered by floor then number. Admin edits one
 * dormitory at a time, so its tabs must not list another residence's rooms —
 * `useAllRooms` would, because every dormitory shares the same tables.
 */
export function useDormRooms(): Room[] {
  const rooms = useAllRooms();
  const floors = useFloors();
  return useMemo(() => {
    const order = new Map(floors.map((f, i) => [f.id, i]));
    return rooms.filter((r) => order.has(r.floorId));
  }, [rooms, floors]);
}

/** Beds of the active residence, used to render occupancy in the warden tabs. */
export function useDormBeds(): Bed[] {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormRooms();
  return useMemo(() => {
    const ids = new Set(rooms.map((r) => r.id));
    return beds.filter((b) => ids.has(b.roomId));
  }, [beds, rooms]);
}

/**
 * The active residence's rooms plus a predicate for filtering history. The duty
 * ring is a single estate-wide queue, so a raw list would mix another
 * residence's rooms into the warden's log — but records of *deleted* rooms stay
 * visible, because removing a room must not erase the audit trail.
 */
export function useDormHistoryRooms(): { rooms: Room[]; inScope: (roomId: ID) => boolean } {
  const all = useDormStore((s) => s.rooms);
  const rooms = useDormRooms();
  return useMemo(() => {
    const mine = new Set(rooms.map((r) => r.id));
    const known = new Set(all.map((r) => r.id));
    return { rooms, inScope: (roomId: ID) => mine.has(roomId) || !known.has(roomId) };
  }, [all, rooms]);
}

export function useRoomBeds(roomId: ID | null | undefined): Bed[] {
  const beds = useDormStore((s) => s.beds);
  return useMemo(() => (roomId ? bedsOfRoom(beds, roomId) : []), [beds, roomId]);
}

/** The students currently holding a place in this room. */
export function useResidents(roomId: ID | null | undefined): Student[] {
  const beds = useDormStore((s) => s.beds);
  const students = useDormStore((s) => s.students);
  return useMemo(() => (roomId ? residentsOfRoom(beds, students, roomId) : []), [beds, students, roomId]);
}

export function useStudents(): Student[] {
  return useDormStore((s) => s.students);
}

/**
 * Residents of the *active* residence, plus everyone who holds no place at all.
 * A student placed in another residence is excluded so the register and the
 * payment ledger stay inside the header selector — but an unplaced student
 * belongs to nobody, and dropping them would make the waiting list unreachable
 * and "Joy berish" impossible.
 */
export function useDormStudents(): Student[] {
  const students = useStudents();
  const dormBeds = useDormBeds();
  const beds = useDormStore((s) => s.beds);
  return useMemo(() => {
    const mine = new Set(dormBeds.map((b) => b.studentId).filter((id): id is ID => id !== null));
    const placed = new Set(beds.map((b) => b.studentId).filter((id): id is ID => id !== null));
    return students.filter((s) => mine.has(s.id) || !placed.has(s.id));
  }, [students, dormBeds, beds]);
}

/** Placements limited to the active residence. */
export function useDormPlacements(): Map<ID, Placement> {
  const all = usePlacements();
  const beds = useDormBeds();
  return useMemo(() => {
    const map = new Map<ID, Placement>();
    for (const bed of beds) {
      if (bed.studentId === null) continue;
      const placement = all.get(bed.studentId);
      if (placement) map.set(bed.studentId, placement);
    }
    return map;
  }, [all, beds]);
}

export function useStudent(studentId: ID | null | undefined): Student | null {
  const students = useDormStore((s) => s.students);
  return useMemo(() => (studentId ? students.find((s) => s.id === studentId) ?? null : null), [students, studentId]);
}

export type { Occupancy };

/** Headline numbers for every residence in the store. */
export function useOccupancy(): Occupancy {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormStore((s) => s.rooms);
  return useMemo(() => occupancyOf(beds, rooms), [beds, rooms]);
}

/**
 * The same numbers limited to the active residence. Admin edits one dormitory
 * at a time, so its stat cards must follow the selector in the header instead
 * of reporting the whole estate.
 */
export function useDormOccupancy(): Occupancy {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormRooms();
  return useMemo(() => occupancyOf(beds, rooms), [beds, rooms]);
}

export interface Placement {
  bed: Bed;
  room: Room | null;
}

/**
 * studentId -> where they sleep. Built once per registry change so lists of
 * students can show their room or bed number without a lookup per row.
 */
export function usePlacements(): Map<ID, Placement> {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormStore((s) => s.rooms);
  return useMemo(() => {
    const map = new Map<ID, Placement>();
    for (const bed of beds) {
      if (bed.studentId === null) continue;
      map.set(bed.studentId, { bed, room: rooms.find((r) => r.id === bed.roomId) ?? null });
    }
    return map;
  }, [beds, rooms]);
}

/** roomId -> the first names of its residents, for compact register cells. */
export function useRoomResidentNames(): Map<ID, string[]> {
  const beds = useDormStore((s) => s.beds);
  const students = useDormStore((s) => s.students);
  return useMemo(() => {
    const map = new Map<ID, string[]>();
    for (const bed of beds) {
      if (bed.studentId === null) continue;
      const student = students.find((st) => st.id === bed.studentId);
      if (!student) continue;
      const list = map.get(bed.roomId) ?? [];
      list.push(student.name.split(' ')[0] ?? student.name);
      map.set(bed.roomId, list);
    }
    return map;
  }, [beds, students]);
}

/** Everyone living on a floor, without rendering one list per room. */
export function useFloorResidents(floorId: ID | null | undefined): Student[] {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormStore((s) => s.rooms);
  const students = useDormStore((s) => s.students);
  return useMemo(() => {
    if (!floorId) return [];
    const ids = new Set(rooms.filter((r) => r.floorId === floorId).map((r) => r.id));
    return students.filter((st) => beds.some((b) => b.studentId === st.id && ids.has(b.roomId)));
  }, [beds, rooms, students, floorId]);
}

/** How many people hold a place in a room — for cells the list is not rendered. */
export function useRoomOccupant(roomId: ID | null | undefined): number {
  const beds = useDormStore((s) => s.beds);
  return useMemo(() => (roomId ? occupiedCount(beds, roomId) : 0), [beds, roomId]);
}

/** The room a signed-in resident belongs to, resolved through their bed. */
export function useUserRoom(user: User | null): Room | null {
  const beds = useDormStore((s) => s.beds);
  const rooms = useDormStore((s) => s.rooms);
  const students = useDormStore((s) => s.students);
  return useMemo(() => {
    if (!user || isResidenceStaff(user)) return null;
    const student = students.find((s) => s.userId === user.id);
    const bed = student ? beds.find((b) => b.studentId === student.id) : null;
    const roomId = bed ? bed.roomId : user.roomId;
    return rooms.find((r) => r.id === roomId) ?? null;
  }, [user, beds, rooms, students]);
}

/** The place a signed-in resident holds, for "your bed" copy. */
export function useUserBed(user: User | null): Bed | null {
  const beds = useDormStore((s) => s.beds);
  const students = useDormStore((s) => s.students);
  return useMemo(() => {
    if (!user || isResidenceStaff(user)) return null;
    const student = students.find((s) => s.userId === user.id);
    return student ? beds.find((b) => b.studentId === student.id) ?? null : null;
  }, [user, beds, students]);
}

/** Queue resolved to live Room records, dropping ids that were deleted. */
export function useDutyRing(): Room[] {
  const queue = useDormStore((s) => s.queue);
  const rooms = useDormStore((s) => s.rooms);
  return useMemo(
    () => queue.map((id) => rooms.find((r) => r.id === id)).filter((r): r is Room => Boolean(r)),
    [queue, rooms],
  );
}

/* -------------------------------- payments -------------------------------- */

export function usePayments(): Payment[] {
  return useDormStore((s) => s.payments);
}

/**
 * What every student owes and has paid, keyed by student id. Coverage and
 * arrears are derived from the payment ledger rather than stored, so a new
 * payment needs no bookkeeping anywhere else.
 */
export function usePaymentSummaries(students: Student[]): Map<ID, PaymentSummary> {
  const payments = usePayments();
  return useMemo(() => paymentSummaries(payments, students), [payments, students]);
}

/** Records for one student, oldest month first — the ledger under the row. */
export function useStudentPayments(studentId: ID | null): Payment[] {
  const payments = usePayments();
  return useMemo(() => (studentId ? paymentsOfStudent(payments, studentId) : []), [payments, studentId]);
}