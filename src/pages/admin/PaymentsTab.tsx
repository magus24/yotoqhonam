import { useMemo, useState } from 'react';
import { ChevronDown, CreditCard, Plus } from 'lucide-react';
import type { Floor, PaymentState, Student } from '../../data/types';
import {
  useFloors,
  useDormPlacements,
  useDormStudents,
  usePayments,
  usePaymentSummaries,
} from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { EmptyState, KeyTag } from '../../components/ui/Primitives';
import { addMonths, formatMonth, formatShortDate, formatSum, monthKey } from '../../lib/utils';
import { DangerButton, report } from './ui';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useDormStore } from '../../store/dormStore';

type Filter = 'all' | 'due' | 'none' | 'current';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Hammasi' },
  { id: 'current', label: 'To‘liq to‘lagan' },
  { id: 'due', label: 'Qarzdor' },
  { id: 'none', label: 'To‘lanmagan' },
];

const STATE_STYLES: Record<PaymentState, string> = {
  current: 'border-mint-600/30 bg-mint-400/12 text-mint-700',
  due: 'border-brass-400/40 bg-brass-400/14 text-brass-700',
  none: 'border-graphite-950/12 bg-graphite-950/[0.04] text-text-dim',
};

const STATE_LABEL: Record<PaymentState, string> = {
  current: 'To‘liq',
  due: 'Qarz',
  none: 'To‘lanmagan',
};

export function PaymentsTab() {
  const students = useDormStudents();
  const floors = useFloors();
  const placements = useDormPlacements();
  const payments = usePayments();
  const summaries = usePaymentSummaries(students);
  const deletePayment = useDormStore((s) => s.deletePayment);

  const [filter, setFilter] = useState<Filter>('all');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [payingStudent, setPayingStudent] = useState<Student | null>(null);
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [quickStudentId, setQuickStudentId] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return students.filter((s) => {
      const summary = summaries.get(s.id);
      const where = placements.get(s.id);

      if (filter === 'due' && summary?.state !== 'due') return false;
      if (filter === 'none' && summary?.state !== 'none') return false;
      if (filter === 'current' && summary?.state !== 'current') return false;

      if (selectedFloorId !== 'all' && where?.room?.floorId !== selectedFloorId) {
        return false;
      }

      if (!needle) return true;
      return (
        s.name.toLowerCase().includes(needle) ||
        (s.studentId ?? '').toLowerCase().includes(needle) ||
        (s.phone ?? '').includes(needle) ||
        (where?.room?.number ?? '').includes(needle)
      );
    });
  }, [students, summaries, placements, filter, selectedFloorId, q]);

  /* Headline numbers: what the residence collected and what it is owed. */
  const stats = useMemo(() => {
    const now = monthKey();
    let collected = 0;
    let arrears = 0;
    let due = 0;
    let fullyPaid = 0;
    for (const s of students) {
      const summary = summaries.get(s.id);
      if (!summary) continue;
      for (const p of summary.payments) {
        const span = p.months;
        const start = p.fromMonth < now ? p.fromMonth : now;
        const end = addMonths(p.fromMonth, span - 1);
        const last = end > now ? now : end;
        if (start <= last) collected += p.monthlyFee;
      }
      if (summary.state === 'current') fullyPaid += 1;
      if (summary.state === 'due') {
        due += 1;
        const last = summary.payments[summary.payments.length - 1];
        arrears += summary.arrears * (last?.monthlyFee ?? 350000);
      }
    }
    return { collected, arrears, due, fullyPaid };
  }, [students, summaries]);

  return (
    <section className="space-y-5">
      {/* Top figures */}
      <dl className="grid gap-3 sm:grid-cols-4">
        <Stat
          label={`${formatMonth(monthKey())} yig‘ilgani`}
          value={formatSum(stats.collected)}
          tone="mint"
          sub="Joriy oy uchun"
        />
        <Stat
          label="Jami qarzdorlik"
          value={formatSum(stats.arrears)}
          tone={stats.due > 0 ? 'brass' : 'default'}
          sub={`${stats.due} ta talaba qarzda`}
        />
        <Stat
          label="To‘liq to‘laganlar"
          value={String(stats.fullyPaid)}
          tone="mint"
          sub={`${students.length} ta residentdan`}
        />
        <Stat
          label="To‘lov yozuvlari"
          value={String(payments.length)}
          sub="Jami kiritilgan kvitansiyalar"
        />
      </dl>

      {/* Controls & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Floor selector */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Filter by floor">
            <button
              onClick={() => setSelectedFloorId('all')}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedFloorId === 'all'
                  ? 'border-mint-600/40 bg-mint-400/15 text-mint-700 font-semibold'
                  : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text'
              }`}
            >
              Barcha qavatlar
            </button>
            {floors.map((fl: Floor) => (
              <button
                key={fl.id}
                onClick={() => setSelectedFloorId(fl.id)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedFloorId === fl.id
                    ? 'border-mint-600/40 bg-mint-400/15 text-mint-700 font-semibold'
                    : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text'
                }`}
              >
                {fl.name}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setNewPaymentOpen(true)}
            icon={<Plus className="size-3.5" />}
          >
            Yangi to‘lov kiritish
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter by payment state">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={f.id === filter}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  f.id === filter
                    ? 'border-mint-600/35 bg-mint-400/12 text-mint-700 font-semibold'
                    : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ism, xona, ID yoki tel..."
            aria-label="Search residents"
            className="field max-w-xs"
          />

          <p className="font-mono text-xs tabular-nums text-text-dim sm:ml-auto">
            {filtered.length} / {students.length} talaba
          </p>
        </div>
      </div>

      {/* Quick modal trigger for select dropdown */}
      {newPaymentOpen ? (
        <div className="panel-quiet animate-fade-up p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text">Qaysi talaba uchun to‘lov kiritmoqchisiz?</h3>
            <Button variant="ghost" size="sm" onClick={() => setNewPaymentOpen(false)}>
              Yopish
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={quickStudentId}
              onChange={(e) => setQuickStudentId(e.target.value)}
              className="field max-w-md"
            >
              <option value="">Talabani ro‘yxatdan tanlang...</option>
              {students.map((st) => {
                const wh = placements.get(st.id);
                return (
                  <option key={st.id} value={st.id}>
                    {st.name} {wh ? `(${wh.room?.number}-xona)` : '(joysiz)'}
                  </option>
                );
              })}
            </select>
            <Button
              size="sm"
              disabled={!quickStudentId}
              onClick={() => {
                const st = students.find((s) => s.id === quickStudentId);
                if (st) {
                  setPayingStudent(st);
                  setNewPaymentOpen(false);
                }
              }}
              icon={<CreditCard className="size-3.5" />}
            >
              To‘lov oynasini ochish
            </Button>
          </div>
        </div>
      ) : null}

      {/* Student List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="To‘lovlar topilmadi"
          body={
            students.length === 0
              ? 'Yotoqxonada talabalar ro‘yxati bo‘sh.'
              : 'Qidiruv yoki filtr bo‘yicha talaba topilmadi.'
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((s) => {
            const summary = summaries.get(s.id);
            const where = placements.get(s.id);
            const open = openId === s.id;
            const state: PaymentState = summary?.state ?? 'none';
            return (
              <li key={s.id} className="panel-quiet p-4 transition-all hover:border-graphite-950/20">
                <div className="flex flex-wrap items-center gap-3">
                  <KeyTag initials={s.initials} tone={state === 'due' ? 'brass' : state === 'current' ? 'mint' : 'default'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text">{s.name}</p>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.2 text-[10px] font-semibold ${
                          STATE_STYLES[state]
                        }`}
                      >
                        {STATE_LABEL[state]}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[11px] text-text-dim">
                      {where ? `${where.room?.number}-xona · ${where.bed.number}-joy` : 'Joysiz'}
                      {summary?.coveredThrough ? ` · ${formatMonth(summary.coveredThrough)} gacha to‘langan` : ' · To‘lanmagan'}
                      {s.phone ? ` · ${s.phone}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold tabular-nums text-text">
                      {summary?.monthsPaid ?? 0} oy to‘langan
                    </p>
                    <p className="font-mono text-[11px] tabular-nums text-text-dim">
                      {formatSum(summary?.paid ?? 0)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setPayingStudent(s)}
                      icon={<CreditCard className="size-3.5" />}
                    >
                      To‘lov kiritish
                    </Button>
                    <button
                      onClick={() => setOpenId(open ? null : s.id)}
                      aria-expanded={open}
                      title="To‘lovlar tarixi"
                      className="grid size-8 place-items-center rounded-lg border border-graphite-950/10 text-text-mist transition-colors hover:bg-graphite-950/[0.06] hover:text-text"
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible payment history & debt status */}
                {open && summary ? (
                  <div className="mt-3.5 border-t border-graphite-950/[0.08] pt-3.5">
                    {summary.arrears > 0 ? (
                      <div className="mb-3 rounded-xl border border-brass-400/40 bg-brass-400/10 p-2.5 text-xs text-brass-700">
                        <strong>Qarzdorlik:</strong> {summary.arrears} oylik qarz — {formatMonth(addMonths(summary.coveredThrough ?? monthKey(), 1))} oyidan buyon to‘lanmagan.
                      </div>
                    ) : null}

                    {summary.payments.length === 0 ? (
                      <p className="text-xs text-text-dim">Ushbu talaba uchun to‘lov yozuvlari mavjud emas.</p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="engrave mb-1">To‘lov yozuvlari tarixi:</p>
                        <ul className="space-y-1.5">
                          {summary.payments
                            .slice()
                            .reverse()
                            .map((p) => (
                              <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-graphite-950/[0.08] bg-ink-900/50 px-3 py-2 text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-text">
                                    {formatMonth(p.fromMonth)} — {formatMonth(addMonths(p.fromMonth, p.months - 1))}
                                  </span>
                                  <span className="ml-2 font-mono text-[11px] text-text-dim">
                                    ({p.months} oy · {formatSum(p.monthlyFee * p.months)})
                                  </span>
                                  {p.note ? <p className="text-[10px] text-text-mist">{p.note}</p> : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] text-text-dim">
                                    {formatShortDate(p.paidAt.slice(0, 10))}
                                  </span>
                                  <DangerButton
                                    label="O‘chirish"
                                    onClick={() =>
                                      report(deletePayment(p.id), ['O‘chirildi', 'To‘lov yozuvi o‘chirildi.'])
                                    }
                                  />
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal for recording payment */}
      <RecordPaymentModal
        open={Boolean(payingStudent)}
        student={payingStudent}
        onClose={() => setPayingStudent(null)}
      />
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'mint' | 'brass';
}) {
  return (
    <div className="panel-quiet p-4">
      <dt className="engrave">{label}</dt>
      <dd
        className={`mt-1.5 font-display text-2xl font-semibold tabular-nums ${
          tone === 'mint' ? 'text-mint-700' : tone === 'brass' ? 'text-brass-700' : 'text-text'
        }`}
      >
        {value}
      </dd>
      {sub ? <p className="mt-0.5 text-[11px] text-text-dim">{sub}</p> : null}
    </div>
  );
}