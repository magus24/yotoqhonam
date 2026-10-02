import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type { Student } from '../../data/types';
import { paymentSummary } from '../../data/registry';
import { useDormStore } from '../../store/dormStore';
import { useDormPlacements, usePayments } from '../../store/useRegistry';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { KeyTag } from '../../components/ui/Primitives';
import { addMonths, formatMonth, formatShortDate, formatSum, monthKey } from '../../lib/utils';
import { DangerButton, Field, report, Row } from './ui';

const PRESET_MONTHS = [
  { count: 1, label: '1 oy' },
  { count: 2, label: '2 oy' },
  { count: 3, label: '3 oy' },
  { count: 5, label: '5 oy (Semestr)' },
  { count: 10, label: '10 oy (O‘quv yili)' },
];

const PAYMENT_METHODS = ['Naqd', 'Click', 'Payme', 'Bank kartasi', 'Homiylik'];

export function RecordPaymentModal({
  open,
  student,
  onClose,
}: {
  open: boolean;
  student: Student | null;
  onClose: () => void;
}) {
  const payments = usePayments();
  const placements = useDormPlacements();
  const addPayment = useDormStore((s) => s.addPayment);
  const deletePayment = useDormStore((s) => s.deletePayment);

  const placement = student ? placements.get(student.id) : null;
  const summary = student ? paymentSummary(payments, student.id) : null;

  const [months, setMonths] = useState<number>(1);
  const [fromMonth, setFromMonth] = useState<string>(monthKey());
  const [fee, setFee] = useState<string>('350000');
  const [method, setMethod] = useState<string>('Click');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (!open || !student) return;
    const currentSum = paymentSummary(payments, student.id);
    if (currentSum.coveredThrough) {
      setFromMonth(addMonths(currentSum.coveredThrough, 1));
    } else {
      setFromMonth(monthKey());
    }
    setMonths(1);
    setFee('350000');
    setMethod('Click');
    setNote('');
  }, [open, student, payments]);

  if (!student) return null;

  const numericFee = Number(fee) || 0;
  const totalAmount = months * numericFee;
  const throughMonth = addMonths(fromMonth, Math.max(1, months) - 1);

  const handleSave = () => {
    const combinedNote = note.trim()
      ? `${method}: ${note.trim()}`
      : method;

    const ok = report(
      addPayment({
        studentId: student.id,
        fromMonth,
        months,
        monthlyFee: numericFee,
        note: combinedNote,
      }),
      ['To‘lov qabul qilindi', `${student.name} uchun ${months} oylik to‘lov saqlandi.`],
    );

    if (ok) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Talaba to‘lovini kiritish"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" onClick={handleSave} icon={<Check className="size-4" />}>
            To‘lovni saqlash ({formatSum(totalAmount)})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Student identification card */}
        <div className="flex items-center gap-3 rounded-2xl border border-graphite-950/10 bg-graphite-950/[0.03] p-3.5">
          <KeyTag initials={student.initials} tone={summary?.state === 'due' ? 'brass' : 'mint'} />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-text">{student.name}</h4>
            <p className="truncate font-mono text-[11px] text-text-dim">
              {placement ? `${placement.room?.number}-xona · ${placement.bed.number}-joy` : 'Joysiz'}
              {student.studentId ? ` · ID: ${student.studentId}` : ''}
              {student.phone ? ` · ${student.phone}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                summary?.state === 'current'
                  ? 'border-mint-600/30 bg-mint-400/12 text-mint-700'
                  : summary?.state === 'due'
                    ? 'border-brass-400/40 bg-brass-400/14 text-brass-700'
                    : 'border-graphite-950/12 bg-graphite-950/[0.04] text-text-dim'
              }`}
            >
              {summary?.state === 'current'
                ? 'To‘liq to‘langan'
                : summary?.state === 'due'
                  ? `${summary.arrears} oy qarz`
                  : 'To‘lanmagan'}
            </span>
            <p className="mt-0.5 font-mono text-[10px] text-text-dim">
              {summary?.monthsPaid ? `${summary.monthsPaid} oy to‘langan` : 'To‘lov yo‘q'}
            </p>
          </div>
        </div>

        {/* Quick Month Presets */}
        <div>
          <label className="engrave">Necha oy to‘lanmoqda?</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESET_MONTHS.map((p) => (
              <button
                key={p.count}
                type="button"
                onClick={() => setMonths(p.count)}
                className={`rounded-xl border px-3 py-1 text-xs font-medium transition-colors ${
                  months === p.count
                    ? 'border-mint-600/40 bg-mint-400/15 text-mint-700 font-semibold'
                    : 'border-graphite-950/10 text-text-mist hover:border-graphite-950/20 hover:text-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <Row>
          <Field label="Oylar soni" hint="1 dan 24 oygacha">
            <input
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
              className="field"
            />
          </Field>
          <Field label="Qaysi oydan boshlab" hint="YYYY-MM formati">
            <input
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="field"
            />
          </Field>
        </Row>

        <Row>
          <Field label="Oylik to‘lov stavkasi (UZS)" hint="Standart: 350 000">
            <input
              type="text"
              value={fee}
              onChange={(e) => setFee(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="field"
              inputMode="numeric"
            />
          </Field>
          <Field label="To‘lov usuli">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="field"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Field label="Izoh / Kvitansiya yoki chek raqami (ixtiyoriy)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field"
            placeholder="Masalan: Chek #49281 yoki ota-onasi to‘ladi"
          />
        </Field>

        {/* Calculation summary card */}
        <div className="rounded-2xl border border-mint-600/30 bg-mint-400/[0.08] p-3.5 text-xs">
          <div className="flex items-center justify-between text-text font-medium">
            <span>To‘lov hisobi:</span>
            <span className="font-mono text-sm font-bold text-mint-700">{formatSum(totalAmount)}</span>
          </div>
          <p className="mt-1 text-[11px] text-text-dim">
            {months} oy × {formatSum(numericFee)} = {formatSum(totalAmount)}
          </p>
          <p className="mt-0.5 text-[11px] text-mint-700">
            Qoplanadigan davr: <strong>{formatMonth(fromMonth)}</strong> dan{' '}
            <strong>{formatMonth(throughMonth)}</strong> gacha ({months} oy to‘liq yopiladi).
          </p>
        </div>

        {/* Previous Payment History for this Student */}
        {summary && summary.payments.length > 0 ? (
          <div className="border-t border-graphite-950/10 pt-3">
            <p className="engrave mb-2">Avvalgi to‘lovlar tarixi ({summary.payments.length} ta yozuv)</p>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {summary.payments
                .slice()
                .reverse()
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-graphite-950/10 bg-ink-900/50 px-3 py-2 text-xs"
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
        ) : null}
      </div>
    </Modal>
  );
}
