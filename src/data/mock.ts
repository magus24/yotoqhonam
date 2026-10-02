import type {
  Bed,
  DemoState,
  Dormitory,
  Duty,
  Floor,
  Payment,
  Room,
  Student,
  User,
} from './types';
import { addDaysISO, addMonths, initialsOf, monthKey, todayISO } from '../lib/utils';

export const DORMITORY: Dormitory = {
  id: 'dorm_1',
  name: 'Yotoqhonam Residence',
  address: 'Universitet ko‘chasi 14, Toshkent',
};

export const FLOORS: Floor[] = [1, 2, 3, 4].map((n) => ({
  id: `floor_${n}`,
  dormitoryId: DORMITORY.id,
  number: n,
  name: `Floor ${n}`,
}));

/** Rooms per floor, and their capacity, walking up the corridor. */
const ROOM_PLAN: { capacity: number }[] = [
  { capacity: 4 },
  { capacity: 4 },
  { capacity: 3 },
  { capacity: 4 },
  { capacity: 4 },
  { capacity: 4 },
  { capacity: 3 },
  { capacity: 4 },
  { capacity: 2 },
  { capacity: 4 },
];

/**
 * Every floor holds ten rooms either side of a central corridor: odd slots on
 * the north side, even on the south, 3.25 apart. `x` spans the corridor and `z`
 * is the distance out from it, so the 3D plan reads like a real floor.
 *
 * Floor 2 keeps the ids and coordinates it always had, because the seeded duty
 * ring (`room_204 … room_207`) points at them.
 */
function buildSeedRooms(): Room[] {
  return FLOORS.flatMap((floor) =>
    ROOM_PLAN.map((slot, i) => {
      const number = `${floor.number}0${i + 1}`;
      return {
        id: `room_${number}`,
        floorId: floor.id,
        number,
        capacity: slot.capacity,
        x: -6.5 + 3.25 * i,
        z: i % 2 === 0 ? -2.6 : 2.6,
        side: i % 2 === 0 ? ('north' as const) : ('south' as const),
      };
    }),
  );
}

export const ROOMS: Room[] = buildSeedRooms();

/** The floor the demo opens on: the one the duty ring runs through. */
export const LIVE_FLOOR_ID = 'floor_2';

export const USERS: User[] = [
  { id: 'u_aziz', name: 'Aziz Karimov', email: 'student@yotoqhonam.demo', roomId: 'room_205', role: 'student', initials: 'AK' },
  { id: 'u_bek', name: 'Bek Ismoilov', email: 'bek@yotoqhonam.demo', roomId: 'room_205', role: 'student', initials: 'BI' },
  { id: 'u_ali', name: 'Ali Nazarov', email: 'ali@yotoqhonam.demo', roomId: 'room_205', role: 'student', initials: 'AN' },
  { id: 'u_timur', name: 'Timur Saidov', email: 'timur@yotoqhonam.demo', roomId: 'room_205', role: 'student', initials: 'TS' },

  { id: 'u_sherzod', name: 'Sherzod Rahimov', email: 'sherzod@yotoqhonam.demo', roomId: 'room_204', role: 'student', initials: 'SR' },
  { id: 'u_dilnoza', name: 'Dilnoza Tursunova', email: 'dilnoza@yotoqhonam.demo', roomId: 'room_204', role: 'student', initials: 'DT' },
  { id: 'u_jasur', name: 'Jasur Eshonqulov', email: 'jasur@yotoqhonam.demo', roomId: 'room_204', role: 'student', initials: 'JE' },
  { id: 'u_madina', name: 'Madina Qo‘ldosheva', email: 'madina@yotoqhonam.demo', roomId: 'room_204', role: 'student', initials: 'MQ' },

  { id: 'u_oybek', name: 'Oybek Toshev', email: 'oybek@yotoqhonam.demo', roomId: 'room_206', role: 'student', initials: 'OT' },
  { id: 'u_nodira', name: 'Nodira Alieva', email: 'nodira@yotoqhonam.demo', roomId: 'room_206', role: 'student', initials: 'NA' },
  { id: 'u_sardor', name: 'Sardor Umarov', email: 'sardor@yotoqhonam.demo', roomId: 'room_206', role: 'student', initials: 'SU' },
  { id: 'u_kamila', name: 'Kamila Yuldasheva', email: 'kamila@yotoqhonam.demo', roomId: 'room_206', role: 'student', initials: 'KY' },

  { id: 'u_rustam', name: 'Rustam Yoldoshev', email: 'rustam@yotoqhonam.demo', roomId: 'room_207', role: 'student', initials: 'RY' },
  { id: 'u_zarina', name: 'Zarina Xolmatova', email: 'zarina@yotoqhonam.demo', roomId: 'room_207', role: 'student', initials: 'ZX' },
  { id: 'u_hasan', name: 'Hasan Boboyev', email: 'hasan@yotoqhonam.demo', roomId: 'room_207', role: 'student', initials: 'HB' },

  { id: 'u_sanjar', name: 'Sanjar Mirzayev', email: 'sanjar@yotoqhonam.demo', roomId: 'room_208', role: 'student', initials: 'SM' },
  { id: 'u_gulnora', name: 'Gulnora Shokirova', email: 'gulnora@yotoqhonam.demo', roomId: 'room_208', role: 'student', initials: 'GS' },
  { id: 'u_abbos', name: 'Abbos Ne‘matov', email: 'abbos@yotoqhonam.demo', roomId: 'room_208', role: 'student', initials: 'AN' },
  { id: 'u_elnora', name: 'Elnora Jurayeva', email: 'elnora@yotoqhonam.demo', roomId: 'room_208', role: 'student', initials: 'EJ' },

  { id: 'u_laziz', name: 'Laziz Norqulov', email: 'laziz@yotoqhonam.demo', roomId: 'room_201', role: 'student', initials: 'LN' },
  { id: 'u_malika', name: 'Malika Sobirova', email: 'malika@yotoqhonam.demo', roomId: 'room_201', role: 'student', initials: 'MS' },

  { id: 'u_jasur203', name: 'Jasur Mamatov', email: 'jasur203@yotoqhonam.demo', roomId: 'room_203', role: 'student', initials: 'JM' },
  { id: 'u_yulduz', name: 'Yulduz Olimova', email: 'yulduz@yotoqhonam.demo', roomId: 'room_203', role: 'student', initials: 'YO' },
  { id: 'u_aziz209', name: 'Azizbek Kadirov', email: 'aziz209@yotoqhonam.demo', roomId: 'room_209', role: 'student', initials: 'AK' },

  // The warden runs the whole residence, so there is no room here on purpose —
  // `User.roomId` is null for staff and the console never scopes to one room.
  { id: 'u_admin', name: 'Nodirbek Sattorov', email: 'admin@yotoqhonam.demo', roomId: null, role: 'admin', initials: 'NS' },
];

export const CHECKLIST = [
  { id: 'chk_rooms', label: 'Room cleaned' },
  { id: 'chk_common', label: 'Common area cleaned' },
  { id: 'chk_trash', label: 'Trash removed' },
];

const START_HOUR = 18;
const END_HOUR = 21;

function makeDuty(roomId: string, offsetDays: number, status: Duty['status']): Duty {
  const date = addDaysISO(todayISO(), offsetDays);
  const start = new Date();
  start.setHours(START_HOUR, 0, 0, 0);
  const end = new Date();
  end.setHours(END_HOUR, 0, 0, 0);

  return {
    id: `duty_${roomId}_${date}`,
    roomId,
    date,
    status,
    windowStart: `${String(START_HOUR).padStart(2, '0')}:00`,
    windowEnd: `${String(END_HOUR).padStart(2, '0')}:00`,
    startedAt: status === 'pending' ? null : start.toISOString(),
    completedAt: status === 'completed' ? end.toISOString() : null,
    checklist: CHECKLIST,
    completedItems: status === 'completed' || status === 'awaiting_report' ? CHECKLIST.map((c) => c.id) : [],
  };
}

/**
 * The rotation: rooms run in ascending order and wrap back to the first.
 * Today the duty sits with room 205, so 206 receives the handover.
 */
export const DEMO_QUEUE = ['room_204', 'room_205', 'room_206', 'room_207'];

/**
 * A day of duties for an arbitrary set of rooms. Used on first run and whenever
 * the app is opened on a new calendar day, so the rota always has a live ring
 * without discarding the registry.
 */
export function makeDutiesForDay(roomIds: string[]): Duty[] {
  return roomIds.flatMap((roomId) => [
    makeDuty(roomId, -2, 'completed'),
    makeDuty(roomId, -1, 'completed'),
    makeDuty(roomId, 0, 'pending'),
  ]);
}

export function createInitialDemoState(): DemoState {
  const students = buildStudents();
  return {
    version: 3,
    currentUserId: 'u_aziz',
    queue: [...DEMO_QUEUE],
    activeDutyId: 'duty_room_205_' + addDaysISO(todayISO(), 0),
    duties: [
      makeDuty('room_204', -1, 'completed'),
      makeDuty('room_205', 0, 'pending'),
      makeDuty('room_206', 0, 'pending'),
      makeDuty('room_207', 0, 'pending'),
      makeDuty('room_204', 0, 'pending'),
      makeDuty('room_205', -2, 'completed'),
      makeDuty('room_206', -2, 'completed'),
      makeDuty('room_207', -2, 'completed'),
    ],
    reports: [],
    skippedRoomIds: [],

    dormitories: [{ ...DORMITORY }],
    activeDormitoryId: DORMITORY.id,
    floors: FLOORS.map((f) => ({ ...f })),
    rooms: ROOMS.map((r) => ({ ...r })),
    beds: assignSeedBeds(buildBeds(ROOMS), students),
    students,
    assignmentHistory: [],
    payments: buildSeedPayments(students),
  };
}

export const DEMO_ACCOUNTS = [
  { email: 'admin@yotoqhonam.demo', label: 'Nodirbek Sattorov', hint: 'Butun bino boshqaruvi · 4 ta qavat' },
  { email: 'student@yotoqhonam.demo', label: 'Aziz Karimov', hint: '205-xona · Talaba' },
];

/** Demo-only gate. Any password of 4+ characters is accepted, so the
 *  flow can be tried instantly — swap for a real provider after the MVP. */
export const DEMO_PASSWORD_MIN = 4;

export const ALL_USERS_WITH_INITIALS: User[] = USERS.map((u) => ({ ...u, initials: initialsOf(u.name) }));

/* -------------------------------------------------------------------------- */
/* Registry seeds — derived from the constants above so the demo world is byte  */
/* for byte what it was before the store existed.                             */
/* -------------------------------------------------------------------------- */

const FACULTIES = [
  'Axborot texnologiyalari',
  'Matematika va fizika',
  'Filologiya',
  'Iqtisodiyot',
  'Muhandislik',
];
const UNIVERSITIES = ['Toshkent davlat universiteti', 'O‘zbekiston milliy universiteti', 'SamDU'];

/**
 * Names for the residents who have no demo login. The demo only needs a couple
 * of accounts to sign in with; the rest of the residence still has to be
 * populated for occupancy, payments and the register to mean anything.
 */
const FIRST_NAMES = [
  'Aziz', 'Bek', 'Ali', 'Timur', 'Sherzod', 'Dilnoza', 'Jasur', 'Madina', 'Oybek', 'Nodira',
  'Sardor', 'Kamila', 'Rustam', 'Zarina', 'Hasan', 'Sanjar', 'Gulnora', 'Abbos', 'Elnora', 'Laziz',
  'Malika', 'Jasurbek', 'Yulduz', 'Azizbek', 'Sabina', 'Bobur', 'Davron', 'Kamola', 'Nurbek', 'Sitora',
];
const LAST_NAMES = [
  'Karimov', 'Ismoilov', 'Nazarov', 'Saidov', 'Rahimov', 'Tursunova', 'Eshonqulov', 'Qo‘ldosheva',
  'Toshev', 'Alieva', 'Umarov', 'Yuldasheva', 'Yoldoshev', 'Xolmatova', 'Boboyev', 'Mirzayev',
  'Shokirova', 'Ne‘matov', 'Jurayeva', 'Norqulov', 'Sobirova', 'Mamatov',
];

/** One bed per unit of capacity, all vacant. Beds are numbered from 1. */
export function buildBeds(rooms: Room[]): Bed[] {
  return rooms.flatMap((room) =>
    Array.from({ length: room.capacity }, (_, i) => ({
      id: `bed_${room.id}_${i + 1}`,
      roomId: room.id,
      number: i + 1,
      studentId: null,
    })),
  );
}

function contactFor(index: number): { phone: string; studentId: string } {
  return {
    phone: `+998 9${(1 + (index % 9))}${String(1000000 + index * 7919).slice(0, 7)}`,
    studentId: `22${String(1000 + index * 13).padStart(4, '0')}`,
  };
}

function detailsFor(index: number) {
  return {
    ...contactFor(index),
    university: UNIVERSITIES[index % UNIVERSITIES.length],
    faculty: FACULTIES[index % FACULTIES.length],
    course: (index % 4) + 1,
  };
}

/** How many beds stay empty so the register shows free places to fill. */
function fillCountFor(room: Room, index: number): number {
  return index % 4 === 3 ? room.capacity - 1 : room.capacity;
}

/** Deterministic name for the n-th generated resident, with no repeats. */
function generatedName(n: number): string {
  return `${FIRST_NAMES[n % FIRST_NAMES.length]} ${
    LAST_NAMES[Math.floor(n / FIRST_NAMES.length) % LAST_NAMES.length]
  }`;
}

/**
 * Every resident of the residence: first the demo accounts, then as many
 * generated residents as the free beds need. Deterministic, so the demo world is
 * the same on every load and a fresh clone matches a returning visit.
 */
export function buildStudents(users: User[] = USERS, rooms: Room[] = ROOMS): Student[] {
  const fromAccounts: Student[] = users
    .filter((u) => u.role === 'student')
    .map((u, i) => ({
      id: `stu_${u.id.replace(/^u_/, '')}`,
      name: u.name,
      initials: u.initials,
      email: u.email,
      ...detailsFor(i),
      status: 'active' as const,
      userId: u.id,
    }));

  // The demo accounts already claim a bed each, so only the *remaining* seats of
  // the fill plan need a generated resident. Generating a full plan's worth
  // instead would leave records that no bed points at — students who do not
  // exist anywhere in the app but still appear in the register and the ledger.
  const target = Math.max(0, rooms.reduce((sum, room, i) => sum + fillCountFor(room, i), 0) - fromAccounts.length);

  const taken = new Set(fromAccounts.map((s) => s.name));
  const filler: Student[] = [];
  let n = 0;
  for (const [index, room] of rooms.entries()) {
    if (filler.length >= target) break;
    for (let i = 0; i < fillCountFor(room, index) && filler.length < target; i += 1) {
      let name = generatedName(n);
      while (taken.has(name)) {
        n += 1;
        name = generatedName(n);
      }
      n += 1;
      taken.add(name);
      filler.push({
        id: `stu_gen_${filler.length + 1}`,
        name,
        initials: initialsOf(name),
        ...detailsFor(fromAccounts.length + filler.length),
        status: 'active',
      });
    }
  }

  return [...fromAccounts, ...filler];
}

/**
 * Places the seeded students into the beds. Residents with a demo account go to
 * the room that account points at, so room 205 keeps its four named residents;
 * everyone else fills the remaining beds in order. This is what makes occupancy
 * derivable from `Bed.studentId` alone.
 */
export function assignSeedBeds(beds: Bed[], students: Student[], users: User[] = USERS): Bed[] {
  const next = beds.map((b) => ({ ...b }));
  const taken = new Set<string>();
  const seat = (roomId: string, studentId: string) => {
    const target = next.find((b) => b.roomId === roomId && b.studentId === null);
    if (!target) return false;
    target.studentId = studentId;
    taken.add(studentId);
    return true;
  };

  for (const student of students) {
    if (!student.userId) continue;
    const owner = users.find((u) => u.id === student.userId);
    if (owner?.roomId) seat(owner.roomId, student.id);
  }
  for (const student of students) {
    if (taken.has(student.id)) continue;
    const target = next.find((b) => b.studentId === null);
    if (!target) break;
    target.studentId = student.id;
    taken.add(student.id);
  }
  return next;
}

/** Monthly rent charged in the demo, in UZS. */
export const MONTHLY_FEE = 350_000;

/**
 * A payment ledger the warden can act on: most residents are up to date, a
 * tenth are one or two months behind, another tenth have never paid, and the
 * rest have paid a term in advance.
 */
export function buildSeedPayments(students: Student[], now = monthKey()): Payment[] {
  return students.flatMap((student, i) => {
    const kind = i % 10;
    if (kind === 8) return []; // never paid — the warden has to chase it
    const arrears = kind === 6 ? 2 : kind === 7 ? 1 : 0;
    const months = kind === 9 ? 12 : 6 + (i % 4);
    return [
      {
        id: `pay_${student.id}_1`,
        studentId: student.id,
        fromMonth: addMonths(now, -(months - 1 + arrears)),
        months,
        monthlyFee: MONTHLY_FEE,
        paidAt: `${addDaysISO(todayISO(), -(9 + (i % 27)))}T09:00:00.000Z`,
      },
    ];
  });
}
