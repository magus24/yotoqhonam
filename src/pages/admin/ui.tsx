import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

/** Shared form chrome for the warden console. Uzbek labels, English body prose. */

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="engrave">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-[11px] text-text-dim">{hint}</span> : null}
    </label>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

export function Row3({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-3">{children}</div>;
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-wrap justify-end gap-2">{children}</div>;
}

export function DangerButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="danger" size="sm" onClick={onClick} icon={<Trash2 className="size-3.5" />}>
      {label}
    </Button>
  );
}

/**
 * Every store mutation returns a Result rather than throwing, so no action can
 * fail silently in the UI. This turns one into a toast and reports success.
 */
export function report(result: { ok: boolean; error?: string }, ok: [string, string]): boolean {
  if (result.ok) {
    toast.success(ok[0], ok[1]);
    return true;
  }
  toast.error('Amal bajarilmadi', result.error ?? 'Noma’lum xato.');
  return false;
}
