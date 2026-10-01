import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Building2, MousePointer2 } from 'lucide-react';
import { DORMITORY, FLOORS, ROOMS, USERS, DEMO_QUEUE, residentsOf } from '../data/mock';
import { useReducedMotion } from '../hooks/useMedia';
import { DeferredFloorCanvas } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { RotationDiagram } from '../components/route/RotationDiagram';

export default function Landing() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const stageOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* ================================================================= */}
      {/* The floor plan is the page, not an illustration of it            */}
      {/* ================================================================= */}
      <section ref={sectionRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blueprint absolute inset-0 opacity-70 [mask-image:radial-gradient(100%_70%_at_62%_42%,#000_10%,transparent_74%)]" />
        </div>

        <motion.div
          style={reduced ? undefined : { scale: stageScale, opacity: stageOpacity }}
          className="absolute inset-0 origin-[64%_48%]"
        >
          <DeferredFloorCanvas
            rooms={ROOMS}
            queue={DEMO_QUEUE}
            activeRoomId="room_205"
            nextRoomId="room_206"
            ownRoomId="room_205"
            dutyStatus="pending"
            selectedRoomId={null}
            onSelect={() => {}}
            mode="hero"
            reducedMotion={reduced}
          />
        </motion.div>

        {/* Legibility scrim so type never fights the geometry */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-transparent lg:via-ink-950/45" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-[10px] bg-mint-600 text-white">
              <span className="font-mono text-[13px] font-bold">YQ</span>
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight">Yotoqhonam</span>
          </Link>
          <ButtonLink to="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
        </header>

        <div className="relative z-10 flex flex-1 items-center px-5 pb-24 sm:px-8 lg:px-12">
          <motion.div
            style={reduced ? undefined : { y: textY }}
            className="max-w-2xl"
            initial={{ opacity: 0, y: reduced ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm font-medium text-mint-700">Talabalar turar joyini raqamli boshqarish platformasi</p>
            <h1 className="mt-5 font-display text-display-md font-semibold leading-[0.96] text-balance">
              Yotoqxona, qavat, xona va talaba — bitta hisobda
            </h1>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-text-mist text-pretty sm:text-base">
              Yotoqhonam keeps one register for the whole residence. Every student is attached to a
              room, every room to a floor, every floor to one dormitory — so occupancy and status are
              always one click away instead of a paper list.
            </p>

            <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              {[
                ['Yotoqxona', DORMITORY.name],
                ['Qavat', 'Floor 2'],
                ['Xona', 'Room 205'],
                ['Talaba', residentsOf('room_205').length + ' students'],
              ].map(([label, value], i, arr) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="rounded-lg border border-line-strong bg-ink-900 px-2.5 py-1.5">
                    <span className="block text-[10px] font-medium text-text-dim">{label}</span>
                    <span className="block font-medium text-graphite-950">{value}</span>
                  </span>
                  {i < arr.length - 1 ? (
                    <span aria-hidden className="text-graphite-950/45">
                      /
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink to="/login" icon={<ArrowRight className="size-4" />}>
                Open the demo
              </ButtonLink>
              <ButtonLink to="/login" variant="ghost">
                See a student account
              </ButtonLink>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-text-dim">
              <MousePointer2 className="size-3.5" strokeWidth={1.6} />
              The plan behind this text is live. Each block is a real room with its own record.
            </p>
          </motion.div>
        </div>
      </section>

      <RegisterSection />
      <DutySection />
      <StackSection />
      <ClosingSection />
      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The core value: one register                                                 */
/* -------------------------------------------------------------------------- */

function RegisterSection() {
  const reduced = useReducedMotion();
  const occupied = ROOMS.filter((r) => residentsOf(r.id).length > 0).length;
  const beds = ROOMS.reduce((n, r) => n + residentsOf(r.id).length, 0);
  const capacity = ROOMS.reduce((n, r) => n + r.capacity, 0);

  return (
    <section className="relative border-t border-line px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 className="max-w-[16ch] font-display text-display-sm font-semibold leading-[1.02] text-balance">
              One register, from the residence down to a single bed
            </h2>
            <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-text-mist text-pretty">
              The structure is the product. A resident belongs to a room, a room belongs to a floor, a
              floor belongs to the dormitory. Change a student&rsquo;s room once and every count on
              every screen follows.
            </p>
            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-line pt-6">
              <Figure value={ROOMS.length} label="Rooms on floor 2" />
              <Figure value={beds + '/' + capacity} label="Beds filled" />
              <Figure value={occupied + '/' + ROOMS.length} label="Rooms occupied" />
            </dl>
            <p className="mt-4 text-xs text-text-dim">
              Demo data from the sample residence, not a live campus.
            </p>
          </div>

          <div className="relative">
            <div className="panel p-6 sm:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium">Floor 2 register</p>
                <p className="font-mono text-xs text-text-dim">
                  {ROOMS.length} rooms · {beds} students
                </p>
              </div>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {ROOMS.slice(0, 8).map((room, i) => {
                  const people = residentsOf(room.id);
                  return (
                    <motion.li
                      key={room.id}
                      initial={reduced ? undefined : { opacity: 0, y: 10 }}
                      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: i * 0.04 }}
                      className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
                    >
                      <span className="plate shrink-0 px-2 py-0.5 text-[11px]">{room.number}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-mist">
                        {people.length ? people.map((p) => p.name.split(' ')[0]).join(', ') : 'Vacant'}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-text-dim">
                        {people.length}/{room.capacity}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-text-dim">
                {ROOMS.length - 8} more rooms on the floor. Everything above comes from one array.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Figure({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{value}</dd>
      <p className="mt-1 text-xs text-text-dim">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Duty is the amplifier, not the identity                                     */
/* -------------------------------------------------------------------------- */

function DutySection() {
  const reduced = useReducedMotion();
  const ring = DEMO_QUEUE.map((id) => ROOMS.find((r) => r.id === id)!).filter(Boolean);

  return (
    <section className="relative border-t border-line bg-ink-850 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="order-2 lg:order-1">
          <RotationDiagram
            rooms={ring}
            activeRoomId="room_205"
            reducedMotion={reduced}
            className="relative w-full"
          />
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="max-w-[18ch] font-display text-display-sm font-semibold leading-[1.02] text-balance">
            On top of that, the floor runs itself
          </h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-text-mist text-pretty">
            Rooms sit in a fixed order. When 205 closes its duty it passes the ring to 206, and 204
            becomes last in line. The same room record that shows occupancy also carries the duty,
            the checklist and a photo proof.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ['Live status on the plan', 'Green for ready, amber for today, blue for next.'],
              ['One photo closes it', 'No group chat, no sign-up sheet, no lost paperwork.'],
              ['Stored in the browser', 'The demo keeps its state on this device only.'],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-mint-600" />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-sm text-text-mist">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* What it grows into — clearly labelled as not built yet                      */
/* -------------------------------------------------------------------------- */

const STACK: { now: string; next: string }[] = [
  { now: 'Frontend + demo data', next: 'Real API for students, rooms and floors' },
  { now: 'Records in this browser', next: 'Shared database for the whole residence' },
  { now: 'Photo stored locally', next: 'Object storage with signed uploads' },
  { now: 'Two roles', next: 'Warden, resident and university staff accounts' },
];

function StackSection() {
  const reduced = useReducedMotion();
  return (
    <section className="relative border-t border-line px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[20ch] font-display text-display-sm font-semibold leading-[1.02]">
            What exists now, and what comes next
          </h2>
          <p className="max-w-[36ch] text-sm text-text-mist text-pretty">
            This is a front-end MVP. Nothing in the right-hand column is built yet.
          </p>
        </div>

        <ul className="mt-10 overflow-hidden rounded-3xl border border-line bg-ink-900">
          {STACK.map((row, i) => (
            <motion.li
              key={row.now}
              initial={reduced ? undefined : { opacity: 0 }}
              whileInView={reduced ? undefined : { opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="grid gap-2 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-2 sm:gap-8 sm:px-7"
            >
              <span className="flex items-center gap-2.5 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-forest-500" />
                {row.now}
              </span>
              <span className="flex items-center gap-2.5 text-sm text-text-dim">
                <span className="size-1.5 shrink-0 rounded-full border border-graphite-950/30" />
                {row.next}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function ClosingSection() {
  const reduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-t border-line px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blueprint absolute inset-0 opacity-60" />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-display-lg font-semibold leading-[0.92] text-balance"
        >
          Hisobga oladi, boshqaradi, soddalashtiradi
        </motion.p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/login" size="lg" icon={<ArrowRight className="size-4" />}>
            Open the demo
          </ButtonLink>
          <ButtonLink to="/login" variant="ghost" size="lg">
            Sign in as a resident
          </ButtonLink>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-text-dim">
          <Building2 className="size-3.5" strokeWidth={1.6} />
          Runs entirely in the browser — no server, no install.
        </p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-line px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-text-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          {DORMITORY.name} · {DORMITORY.address}
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {FLOORS.length} floor · {ROOMS.length} rooms on floor 2 · {USERS.length - 1} students
          </span>
          <span className="text-text-mist">Demo build</span>
        </p>
      </div>
    </footer>
  );
}