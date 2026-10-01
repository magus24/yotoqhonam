import { useEffect } from 'react';
import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

let n = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    n += 1;
    const id = `t${n}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  info: (title: string, body?: string) => useToastStore.getState().push({ title, body, tone: 'info' }),
  success: (title: string, body?: string) => useToastStore.getState().push({ title, body, tone: 'success' }),
  error: (title: string, body?: string) => useToastStore.getState().push({ title, body, tone: 'error' }),
};

const TONE = {
  info: { accent: 'bg-brand-300', ring: 'border-brand-300/25' },
  success: { accent: 'bg-mint-400', ring: 'border-mint-400/30' },
  error: { accent: 'bg-alert', ring: 'border-alert/30' },
} as const;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toasts.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(toasts[toasts.length - 1]!.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toasts, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ title, body, tone, onDismiss }: ToastItem & { onDismiss: () => void }) {
  const cfg = TONE[tone];
  return (
    <div
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-ink-850/95 p-4 shadow-lift backdrop-blur-xl ${cfg.ring}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${cfg.accent}`} />
      <div className="pl-2">
        <p className="text-sm font-semibold text-text">{title}</p>
        {body ? <p className="mt-0.5 text-xs text-text-mist text-pretty">{body}</p> : null}
      </div>
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-text-dim transition-colors hover:text-text"
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  );
}
