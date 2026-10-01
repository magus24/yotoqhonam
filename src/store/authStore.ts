import { create } from 'zustand';
import { DEMO_ACCOUNTS, USERS } from '../data/mock';
import { STORAGE_KEYS, readJSON, removeKey, writeJSON } from '../lib/storage';
import type { ID, User } from '../data/types';

interface Session {
  userId: ID;
  signedInAt: string;
}

export interface AuthStore {
  user: User | null;
  ready: boolean;

  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  continueAsDemo: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const FALLBACK_ERROR = 'We could not sign you in with those details.';

function findByEmail(email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  return USERS.find((u) => u.email.toLowerCase() === needle);
}

/** Simulated latency so loading states are real, not decorative. */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  ready: false,

  signIn: async (email, password) => {
    await delay(650);
    const account = findByEmail(email);
    if (!account || password.trim().length < 4) {
      return { ok: false, error: FALLBACK_ERROR };
    }
    const session: Session = { userId: account.id, signedInAt: new Date().toISOString() };
    writeJSON(STORAGE_KEYS.session, session);
    set({ user: account });
    return { ok: true };
  },

  continueAsDemo: async (email) => {
    await delay(300);
    const account = findByEmail(email) ?? USERS.find((u) => u.email === DEMO_ACCOUNTS[0].email);
    if (!account) return { ok: false, error: FALLBACK_ERROR };
    const session: Session = { userId: account.id, signedInAt: new Date().toISOString() };
    writeJSON(STORAGE_KEYS.session, session);
    set({ user: account });
    return { ok: true };
  },

  signOut: () => {
    removeKey(STORAGE_KEYS.session);
    set({ user: null });
  },
}));

/** Rehydrates the session on boot so a refresh never kicks you to /login. */
export function initAuth(): void {
  const session = readJSON<Session | null>(STORAGE_KEYS.session, null);
  const user = session ? USERS.find((u) => u.id === session.userId) ?? null : null;
  useAuthStore.setState({ user, ready: true });
}
