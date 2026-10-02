import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_PASSWORD_MIN } from '../data/mock';
import { useAllRooms, useFloors, useOccupancy, useRoom } from '../store/useRegistry';
import { useAuthStore } from '../store/authStore';
import { useDormStore } from '../store/dormStore';
import { useReducedMotion } from '../hooks/useMedia';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const continueAsDemo = useAuthStore((s) => s.continueAsDemo);

  const [email, setEmail] = useState(DEMO_ACCOUNTS[0]!.email);
  const [password, setPassword] = useState('yotoqhonam');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const occupancy = useOccupancy();
  const floors = useFloors();

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      emailRef.current?.focus();
      return;
    }
    toast.success('Welcome back', 'Opening your floor.');
    navigate(from, { replace: true });
  };

  const quick = async (demoEmail: string) => {
    setPending(demoEmail);
    setError(null);
    const res = await continueAsDemo(demoEmail);
    setPending(null);
    if (res.ok) {
      toast.success('Signed in', 'You are browsing the demo residence.');
      navigate(from, { replace: true });
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden border-r border-graphite-950/[0.09] lg:block">
        <StageBackdrop />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <Link to="/" className="inline-flex w-fit items-center gap-2 text-xs text-text-mist transition-colors hover:text-text">
            <ArrowLeft className="size-3.5" strokeWidth={1.7} />
            Back to the site
          </Link>
          <div>
            <p className="max-w-[26ch] font-display text-display-sm font-semibold leading-[1.02] text-text text-balance">
              Yotoqxona, qavat, xona va talaba — bitta hisobda
            </p>
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-text-mist text-pretty">
              Sign in to see the whole register, your own room, and the floor plan with live status.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-t border-graphite-950/10 pt-6">
            <Stat value={String(occupancy.rooms)} label="Rooms" />
            <Stat value={String(occupancy.occupied)} label="Residents" />
            <Stat value={String(floors.length)} label="Floors" />
          </dl>
        </div>
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <Link to="/" className="mb-9 inline-flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-[10px] border border-brass-400/40 bg-brass-400/12">
              <span className="font-mono text-[13px] font-bold text-brass-600">YQ</span>
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-text">Yotoqhonam</span>
          </Link>

          <h1 className="font-display text-display-sm font-semibold leading-[1.02] text-text">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-mist text-pretty">
            This is a demo build. Use one of the accounts below, or type any password of{' '}
            {DEMO_PASSWORD_MIN}+ characters with a listed email.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field
              id="email"
              label="Email"
              type="email"
              inputRef={emailRef}
              autoComplete="username"
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              placeholder="student@yotoqhonam.demo"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (error) setError(null);
              }}
              placeholder="••••••••"
            />

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-alert/30 bg-alert/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-alert"
              >
                <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-alert" />
                {error}
              </motion.p>
            ) : null}

            <Button type="submit" loading={busy} className="w-full" icon={<ArrowRight className="size-4" />}>
              Sign in
            </Button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-graphite-950/10" />
            <span className="engrave">or use a demo account</span>
            <span className="h-px flex-1 bg-graphite-950/10" />
          </div>

          <ul className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <li key={acc.email}>
                <button
                  onClick={() => quick(acc.email)}
                  disabled={busy || pending !== null}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-2xl border border-graphite-950/[0.10] bg-graphite-950/[0.09] px-4 py-3.5 text-left transition-all duration-300',
                    'hover:border-brass-400/40 hover:bg-graphite-950/[0.06] disabled:opacity-50',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-graphite-950/10 bg-ink-900 text-text-mist transition-colors group-hover:border-brass-400/40 group-hover:text-brass-600">
                    <KeyRound className="size-4" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text">{acc.label}</span>
                    <span className="block truncate font-mono text-[11px] text-text-dim">{acc.email}</span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-[11px] text-text-mist">{acc.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs leading-relaxed text-text-dim text-pretty">
            Demo credentials live in the browser only. No password is ever sent anywhere, and nothing
            you do here leaves this device.
          </p>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StageBackdrop() {
  const reduced = useReducedMotion();
  const activeDutyId = useDormStore((s) => s.activeDutyId);
  const duty = useDormStore((s) => s.duties.find((d) => d.id === activeDutyId) ?? null);
  const rooms = useAllRooms();
  const room = useRoom(duty?.roomId ?? null) ?? rooms[0] ?? null;

  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div className="blueprint absolute inset-0 opacity-50" />
        <motion.div
          className="absolute -left-24 top-1/3 size-[36rem] rounded-full bg-brass-400/[0.09] blur-[120px]"
          animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/0" />
      </div>

      {/* a single room plate, large — the subject, not a card grid */}
      <div className="absolute left-12 top-1/2 z-0 -translate-y-1/2">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-brass-400/10 blur-3xl" />
            <div className="relative plate px-5 py-2.5 text-2xl tracking-[0.2em] text-brass-200">
              {room.number}
            </div>
            <p className="mt-4 font-mono text-2xs uppercase tracking-[0.24em] text-text-dim">
              Floor 2 · {room.side} side
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl font-semibold tracking-tight text-text">{value}</dd>
      <p className="mt-0.5 text-[11px] text-text-dim">{label}</p>
    </div>
  );
}

const Field = function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  inputRef,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-mist">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        required
      />
    </div>
  );
};
