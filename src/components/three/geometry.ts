import type { ID, Room } from '../../data/types';
import { getNextDutyRoom } from '../../data/dutyQueue';

export const ROOM_W = 2.7;
export const ROOM_D = 3.6;
export const ROOM_H = 2.1;
export const CORRIDOR_W = 3.4;
export const BLOCK_GAP = 0.55;

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centreX: number;
  centreZ: number;
}

export function getBounds(rooms: Room[]): Bounds {
  if (rooms.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, centreX: 0, centreZ: 0 };
  }
  const xs = rooms.map((r) => r.x);
  const zs = rooms.map((r) => r.z);
  const minX = Math.min(...xs) - ROOM_W / 2;
  const maxX = Math.max(...xs) + ROOM_W / 2;
  const minZ = Math.min(...zs) - ROOM_D / 2;
  const maxZ = Math.max(...zs) + ROOM_D / 2;
  return { minX, maxX, minZ, maxZ, centreX: (minX + maxX) / 2, centreZ: (minZ + maxZ) / 2 };
}

/** World-space centre of a room block. */
export function roomCentre(room: Room): [number, number, number] {
  return [room.x, ROOM_H / 2, room.z];
}

/** Point on the corridor spine directly outside a room — the "door step". */
export function doorStep(room: Room): [number, number, number] {
  return [room.x, 0.06, room.z > 0 ? ROOM_D / 2 + 0.35 : -ROOM_D / 2 - 0.35];
}

/**
 * The duty route, expressed once. Every component that needs to know
 * "where does the handover go" reads this — no duplicated logic.
 */
export interface RoutePoint {
  roomId: ID;
  position: [number, number, number];
  isCurrent: boolean;
  isNext: boolean;
}

export function buildRoute(rooms: Room[], queue: ID[], activeRoomId: ID | null): RoutePoint[] {
  const ring = queue.map((id) => rooms.find((r) => r.id === id)).filter((r): r is Room => Boolean(r));
  if (ring.length === 0) return [];

  const ordered = activeRoomId
    ? (() => {
        const from = getNextDutyRoom(activeRoomId, ring);
        if (!from) return ring;
        const start = ring.findIndex((r) => r.id === activeRoomId);
        return [...ring.slice(start + 1), ...ring.slice(0, start + 1)];
      })()
    : ring;

  const nextId = getNextDutyRoom(activeRoomId ?? ordered[0]!.id, ring)?.id ?? null;

  return ordered.map((r) => ({
    roomId: r.id,
    position: doorStep(r),
    isCurrent: r.id === activeRoomId,
    isNext: r.id === nextId,
  }));
}
