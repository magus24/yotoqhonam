export type ID = string;

export type Role = 'student' | 'warden' | 'admin';

export type DutyStatus = 'pending' | 'in_progress' | 'awaiting_report' | 'completed' | 'skipped';

export type RoomState = 'ready' | 'duty_today' | 'next_duty' | 'neutral';

export interface User {
  id: ID;
  name: string;
  email: string;
  roomId: ID;
  role: Role;
  /** Two-letter monogram used on the key-tag avatars. */
  initials: string;
}

export interface Dormitory {
  id: ID;
  name: string;
  address: string;
}

export interface Floor {
  id: ID;
  dormitoryId: ID;
  number: number;
  name: string;
}

export interface Room {
  id: ID;
  floorId: ID;
  number: string;
  capacity: number;
  /** Plan-space position: x = across the corridor, z = depth from corridor. */
  x: number;
  z: number;
  side: 'north' | 'south';
}

export interface DutyChecklistItem {
  id: string;
  label: string;
}

export interface Duty {
  id: ID;
  roomId: ID;
  date: string; // YYYY-MM-DD
  status: DutyStatus;
  windowStart: string; // HH:mm
  windowEnd: string; // HH:mm
  startedAt: string | null;
  completedAt: string | null;
  checklist: DutyChecklistItem[];
  completedItems: string[];
}

export interface DutyReport {
  id: ID;
  dutyId: ID;
  /** Data URL for the MVP (localStorage-backed); a CDN URL once storage exists. */
  photoUrl: string;
  createdAt: string;
  note: string;
}

/** Persisted, mutable slice of the demo world (localStorage). */
export interface DemoState {
  version: number;
  currentUserId: ID;
  queue: ID[];
  activeDutyId: ID | null;
  duties: Duty[];
  reports: DutyReport[];
  skippedRoomIds: ID[];
}
