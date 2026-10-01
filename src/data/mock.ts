import type { DemoState, Dormitory, Duty, Floor, Room, User } from './types';
import { addDaysISO, initialsOf, todayISO } from '../lib/utils';

export const DORMITORY: Dormitory = {
  id: 'dorm_1',
  name: 'Yotoqhonam Residence',
  address: 'Universitet ko‘chasi 14, Toshkent',
};

export const FLOORS: Floor[] = [
  { id: 'floor_1', dormitoryId: DORMITORY.id, number: 1, name: 'Floor 1' },
  { id: 'floor_2', dormitoryId: DORMITORY.id, number: 2, name: 'Floor 2' },
  { id: 'floor_3', dormitoryId: DORMITORY.id, number: 3, name: 'Floor 3' },
];

/**
 * Floor 2 is the live floor for the demo. Ten rooms sit either side of a
 * central corridor: even numbers north, odd numbers south.
 * `x` spans the corridor, `z` is the distance out from it.
 */
export const ROOMS: Room[] = [
  { id: 'room_201', floorId: 'floor_2', number: '201', capacity: 4, x: -6.5, z: -2.6, side: 'north' },
  { id: 'room_202', floorId: 'floor_2', number: '202', capacity: 4, x: -3.25, z: 2.6, side: 'south' },
  { id: 'room_203', floorId: 'floor_2', number: '203', capacity: 3, x: 0, z: -2.6, side: 'north' },
  { id: 'room_204', floorId: 'floor_2', number: '204', capacity: 4, x: 3.25, z: 2.6, side: 'south' },
  { id: 'room_205', floorId: 'floor_2', number: '205', capacity: 4, x: 6.5, z: -2.6, side: 'north' },
  { id: 'room_206', floorId: 'floor_2', number: '206', capacity: 4, x: 9.75, z: 2.6, side: 'south' },
  { id: 'room_207', floorId: 'floor_2', number: '207', capacity: 3, x: 13, z: -2.6, side: 'north' },
  { id: 'room_208', floorId: 'floor_2', number: '208', capacity: 4, x: 16.25, z: 2.6, side: 'south' },
  { id: 'room_209', floorId: 'floor_2', number: '209', capacity: 2, x: 19.5, z: -2.6, side: 'north' },
  { id: 'room_210', floorId: 'floor_2', number: '210', capacity: 4, x: 22.75, z: 2.6, side: 'south' },
];

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

  { id: 'u_admin', name: 'Nodirbek Sattorov', email: 'admin@yotoqhonam.demo', roomId: 'room_203', role: 'admin', initials: 'NS' },
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

export function createInitialDemoState(): DemoState {
  return {
    version: 1,
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
  };
}

export const DEMO_ACCOUNTS = [
  { email: 'student@yotoqhonam.demo', label: 'Aziz Karimov', hint: 'Room 205 · student' },
  { email: 'admin@yotoqhonam.demo', label: 'Nodirbek Sattorov', hint: 'Floor 2 · admin' },
];

/** Demo-only gate. Any password of 4+ characters is accepted, so the
 *  flow can be tried instantly — swap for a real provider after the MVP. */
export const DEMO_PASSWORD_MIN = 4;

export function residentsOf(roomId: string): User[] {
  return USERS.filter((u) => u.roomId === roomId && u.role !== 'admin');
}

export const ALL_USERS_WITH_INITIALS: User[] = USERS.map((u) => ({ ...u, initials: initialsOf(u.name) }));
