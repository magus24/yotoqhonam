import type { DutyStatus, ID, Room, RoomState } from './types';

/**
 * The duty rotation is a single ordered ring of rooms.
 * Every ordering concern resolves through these two functions so a
 * different floor, or a different queue order, needs no code changes.
 */
export function getNextDutyRoom(currentRoomId: ID, rooms: Room[]): Room | null {
  if (rooms.length === 0) return null;
  const index = rooms.findIndex((r) => r.id === currentRoomId);
  if (index === -1) return rooms[0] ?? null;
  return rooms[(index + 1) % rooms.length] ?? null;
}

export function getPrevDutyRoom(currentRoomId: ID, rooms: Room[]): Room | null {
  if (rooms.length === 0) return null;
  const index = rooms.findIndex((r) => r.id === currentRoomId);
  if (index === -1) return rooms[rooms.length - 1] ?? null;
  return rooms[(index - 1 + rooms.length) % rooms.length] ?? null;
}

/** Position of a room within the rotation, 1-based. 0 when not in the ring. */
export function getQueuePosition(roomId: ID, queue: ID[]): number {
  const i = queue.indexOf(roomId);
  return i === -1 ? 0 : i + 1;
}

export const ROOM_STATE_ORDER: RoomState[] = ['ready', 'duty_today', 'next_duty', 'neutral'];

export interface RoomVisual {
  key: RoomState;
  label: string;
  /** Base block colour used by the 3D scene. */
  color: string;
  /** Bright accent used for dots, rings and glows. Never used for small text. */
  glow: string;
  /** Accessible foreground for text on a light surface (>= 4.5:1). */
  text: string;
  /** Very light fill for chips and plates. */
  tint: string;
  /** CSS token for legends and badges. */
  token: string;
  description: string;
}

export const ROOM_VISUALS: Record<RoomState, RoomVisual> = {
  ready: {
    key: 'ready',
    label: 'Ready',
    color: '#22C55E',
    glow: '#22C55E',
    text: '#15803D',
    tint: '#DCFCE7',
    token: 'text-forest-600',
    description: 'Closed and cleared for inspection',
  },
  duty_today: {
    key: 'duty_today',
    label: 'Duty today',
    color: '#F59E0B',
    glow: '#F59E0B',
    text: '#B45309',
    tint: '#FEF3C7',
    token: 'text-brass-600',
    description: 'On the rotation right now',
  },
  next_duty: {
    key: 'next_duty',
    label: 'Next duty',
    color: '#3B82F6',
    glow: '#3B82F6',
    text: '#1D4ED8',
    tint: '#DBEAFE',
    token: 'text-mint-600',
    description: 'Receives the handover next',
  },
  neutral: {
    key: 'neutral',
    label: 'Resting',
    color: '#CBD5E1',
    glow: '#94A3B8',
    text: '#475569',
    tint: '#F1F5F9',
    token: 'text-graphite-600',
    description: 'Not on tonight\u2019s rotation',
  },
};

export function resolveRoomState(
  roomId: ID,
  ctx: { currentDutyRoomId: ID | null; nextDutyRoomId: ID | null; ownRoomId: ID | null; dutyStatus: DutyStatus | null },
): RoomState {
  if (ctx.currentDutyRoomId && roomId === ctx.currentDutyRoomId) return 'duty_today';
  if (ctx.nextDutyRoomId && roomId === ctx.nextDutyRoomId) return 'next_duty';
  if (ctx.ownRoomId && roomId === ctx.ownRoomId) return 'ready';
  return 'neutral';
}
