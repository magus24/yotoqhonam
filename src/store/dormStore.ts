import { create } from 'zustand';
import type { DemoState, Duty, DutyReport, ID } from '../data/types';
import { createInitialDemoState, DEMO_QUEUE } from '../data/mock';
import { getNextDutyRoom } from '../data/dutyQueue';
import type { Room } from '../data/types';
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage';
import { todayISO, uid } from '../lib/utils';

function loadState(): DemoState {
  const stored = readJSON<DemoState | null>(STORAGE_KEYS.demoState, null);
  if (stored && stored.version === 1 && Array.isArray(stored.duties)) {
    // A new calendar day invalidates yesterday's "today" duty.
    const stillToday = stored.duties.some((d) => d.date === todayISO());
    if (stillToday) return stored;
  }
  return createInitialDemoState();
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
}

const persist = (s: DemoState) => {
  saveState({
    version: s.version,
    currentUserId: s.currentUserId,
    queue: s.queue,
    activeDutyId: s.activeDutyId,
    duties: s.duties,
    reports: s.reports,
    skippedRoomIds: s.skippedRoomIds,
  });
};

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
}));

/**
 * Selectors kept outside the component tree so three.js and React share one
 * subscription instead of re-rendering on every store write.
 */
export const selectActiveDuty = (s: DormStore): Duty | null =>
  s.duties.find((d) => d.id === s.activeDutyId) ?? null;

export const selectActiveRoomId = (s: DormStore): ID | null => selectActiveDuty(s)?.roomId ?? null;
