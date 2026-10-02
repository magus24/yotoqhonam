export type ID = string;

export type Role = 'student' | 'warden' | 'admin';

export type DutyStatus = 'pending' | 'in_progress' | 'awaiting_report' | 'completed' | 'skipped';

export type RoomState = 'ready' | 'duty_today' | 'next_duty' | 'neutral';

export interface User {
  id: ID;
  name: string;
  email: string;
  /** Null for residence staff: a warden manages the whole estate, not a bed. */
  roomId: ID | null;
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
  /** Mirrors the room's bed count. The store keeps the two in lockstep so
   *  existing `room.capacity` readers (3D sizing, duty copy) stay correct. */
  capacity: number;
  /** Plan-space position: x = across the corridor, z = depth from corridor. */
  x: number;
  z: number;
  side: 'north' | 'south';
}

/**
 * A bed is the unit a student actually occupies. Occupancy is derived from
 * `Bed.studentId` — never from a second copy on Student or Room — so a place
 * can only ever be held by one person.
 */
export interface Bed {
  id: ID;
  roomId: ID;
  /** Bed number inside the room (1-based). Stable for the life of the bed. */
  number: number;
  /** Null when the place is vacant. */
  studentId: ID | null;
}

export type StudentStatus = 'active' | 'moved_out';

export interface Student {
  id: ID;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
  /** University enrolment number. */
  studentId?: string;
  university?: string;
  faculty?: string;
  course?: number;
  status: StudentStatus;
  /** Links a resident record to its demo auth account, when one exists. */
  userId?: ID;
}

/** History row written when a student leaves a place. */
export interface AssignmentEvent {
  id: ID;
  studentId: ID;
  roomId: ID;
  bedId: ID;
  bedNumber: number;
  assignedAt: string;
  endedAt: string | null;
  /** 'moved' when the student was relocated to another bed, 'moved_out' when evicted. */
  reason: 'assigned' | 'moved' | 'moved_out';
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

/**
 * One payment for one student: it covers `months` months starting at
 * `fromMonth`. Nothing is derived from a single "paid until" field on the
 * student, because a student may pay in instalments or pay ahead — the ledger
 * of payments is the truth and the coverage is derived from it.
 */
export interface Payment {
  id: ID;
  studentId: ID;
  /** First month covered, `YYYY-MM`. */
  fromMonth: string;
  /** How many months this one payment settles (1–24). */
  months: number;
  /** Monthly fee in UZS charged for the covered period. */
  monthlyFee: number;
  /** When the money was taken, ISO timestamp. */
  paidAt: string;
  note?: string;
}

export type PaymentState = 'current' | 'due' | 'none';

/** Derived per-student payment position. Never stored. */
export interface PaymentSummary {
  studentId: ID;
  /** Total months settled across every payment. */
  monthsPaid: number;
  /** Total UZS collected across every payment. */
  paid: number;
  /** Latest month covered, `YYYY-MM`, or null when nothing was paid. */
  coveredThrough: string | null;
  /** Months between `coveredThrough` and the current month (0 = up to date). */
  arrears: number;
  state: PaymentState;
  payments: Payment[];
}

/** Persisted, mutable slice of the demo world (localStorage). */
export interface DemoState {
  /** 3 = payment ledger added to the v2 registry (dormitory/floors/rooms/beds/students). */
  version: number;
  currentUserId: ID;
  queue: ID[];
  activeDutyId: ID | null;
  duties: Duty[];
  reports: DutyReport[];
  skippedRoomIds: ID[];

  /** The single source of truth for the residence hierarchy. */
  dormitories: Dormitory[];
  activeDormitoryId: ID;
  floors: Floor[];
  rooms: Room[];
  beds: Bed[];
  students: Student[];
  assignmentHistory: AssignmentEvent[];
  payments: Payment[];
}
