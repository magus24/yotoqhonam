import type { Bed, Floor, ID, Room, Student } from './types';

/**
 * Pure derivations and rules over the residence registry. No React, no storage —
 * the store owns mutations, this file owns meaning. Keeping them apart means the
 * occupancy rules can be reasoned about (and tested) without booting Zustand.
 */

/* --------------------------------- queries -------------------------------- */

export function bedsOfRoom(beds: Bed[], roomId: ID): Bed[] {
  return beds.filter((b) => b.roomId === roomId).sort((a, b) => a.number - b.number);
}

export function bedsOfFloor(beds: Bed[], rooms: Room[], floorId: ID): Bed[] {
  const ids = new Set(rooms.filter((r) => r.floorId === floorId).map((r) => r.id));
  return beds.filter((b) => ids.has(b.roomId));
}

export function occupiedCount(beds: Bed[], roomId: ID): number {
  return bedsOfRoom(beds, roomId).filter((b) => b.studentId !== null).length;
}

/** Students currently holding a place in the given room. */
export function residentsOfRoom(beds: Bed[], students: Student[], roomId: ID): Student[] {
  const holders = new Set(
    bedsOfRoom(beds, roomId)
      .filter((b) => b.studentId !== null)
      .map((b) => b.studentId as ID),
  );
  return students.filter((s) => holders.has(s.id));
}

/** The bed a student holds right now, or null when they have no place. */
export function bedOfStudent(beds: Bed[], studentId: ID): Bed | null {
  return beds.find((b) => b.studentId === studentId) ?? null;
}

export function roomsOfFloor(rooms: Room[], floorId: ID): Room[] {
  return rooms
    .filter((r) => r.floorId === floorId)
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export interface Occupancy {
  occupied: number;
  capacity: number;
  free: number;
  occupiedRooms: number;
  rooms: number;
}

/**
 * Headline numbers for a set of rooms. Callers pass either every room in the
 * store or one residence's rooms — the shape is identical either way.
 */
export function occupancyOf(beds: Bed[], rooms: Room[]): Occupancy {
  const ids = new Set(rooms.map((r) => r.id));
  const scoped = beds.filter((b) => ids.has(b.roomId));
  const occupied = scoped.filter((b) => b.studentId !== null).length;
  return {
    occupied,
    capacity: scoped.length,
    free: scoped.length - occupied,
    occupiedRooms: rooms.filter((r) => occupiedCount(beds, r.id) > 0).length,
    rooms: rooms.length,
  };
}

/* -------------------------------- validation ------------------------------ */

export type Result<T = undefined> = { ok: true; value?: T } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export function validateFloorNumber(
  floors: Floor[],
  dormitoryId: ID,
  number: number,
  ignoreId?: ID,
): Result {
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    return fail('Qavat raqami 1 dan 99 gacha bo‘lishi kerak.');
  }
  const clash = floors.some((f) => f.dormitoryId === dormitoryId && f.number === number && f.id !== ignoreId);
  return clash ? fail(`${number}-qavat allaqachon mavjud.`) : { ok: true };
}

export function validateRoomNumber(
  rooms: Room[],
  floorId: ID,
  number: string,
  ignoreId?: ID,
): Result {
  const trimmed = number.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return fail('Xona raqami faqat raqamlardan iborat bo‘lsin (1–9999).');
  const clash = rooms.some((r) => r.floorId === floorId && r.number === trimmed && r.id !== ignoreId);
  return clash ? fail(`${trimmed}-xona allaqachon mavjud.`) : { ok: true };
}

/** Capacity may never drop below the beds already handed out. */
export function validateCapacity(capacity: number, occupied: number): Result {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 12) {
    return fail('Sig‘im 1 dan 12 gacha bo‘lishi kerak.');
  }
  if (capacity < occupied) {
    return fail(`Sig‘imni kamaytirib bo‘lmaydi: ${occupied} ta joy band.`);
  }
  return { ok: true };
}

export function validateStudentName(name: string): Result {
  return name.trim().length >= 3
    ? { ok: true }
    : fail('Ism-familya kamida 3 ta belgidan iborat bo‘lsin.');
}

/**
 * A place can only be taken if it is free, or already held by this student
 * (which is a no-op move rather than a double booking).
 */
export function validateBedTake(beds: Bed[], bedId: ID, studentId: ID): Result {
  const bed = beds.find((b) => b.id === bedId);
  if (!bed) return fail('Joy topilmadi.');
  if (bed.studentId !== null && bed.studentId !== studentId) {
    return fail('Bu joy band. Avval uni bo‘shating yoki boshqa joy tanlang.');
  }
  return { ok: true };
}

/** Nothing may be deleted while other records still point at it. */
export function canDeleteFloor(rooms: Room[], floorId: ID): Result {
  return rooms.some((r) => r.floorId === floorId)
    ? fail('Avval shu qavatdagi xonalarni o‘chiring.')
    : { ok: true };
}

export function canDeleteRoom(beds: Bed[], roomId: ID): Result {
  const holders = beds.filter((b) => b.roomId === roomId && b.studentId !== null);
  if (holders.length > 0) {
    return fail(`Avval ${holders.length} nafar talabani bo‘shating.`);
  }
  return { ok: true };
}

/* --------------------------------- layout --------------------------------- */

/**
 * Places a new room after the last one on its floor so generated rooms never
 * sit on top of each other in the 3D plan. The corridor alternates sides.
 */
export function nextRoomSlot(rooms: Room[], floorId: ID): { x: number; z: number; side: Room['side'] } {
  const siblings = roomsOfFloor(rooms, floorId);
  const STEP = 3.25;
  const last = siblings[siblings.length - 1];
  const index = siblings.length;
  return {
    x: last ? last.x + STEP : -6.5,
    z: index % 2 === 0 ? -2.6 : 2.6,
    side: index % 2 === 0 ? 'north' : 'south',
  };
}