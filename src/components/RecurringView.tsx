import { useState, type FormEvent } from 'react';
import {
  CalendarClock,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CurrencyCode,
  type RecurringFrequency,
  type RecurringTransaction,
  type TransactionType,
} from '../types/finance';
import {
  computeMonthlyRecurringEquivalent,
  formatCurrency,
  formatDatePL,
  toIsoDate,
} from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface RecurringViewProps {
  items: RecurringTransaction[];
  currency: CurrencyCode;
  onSaveRecurring: (data: {
    id?: string;
    name: string;
    amount: number;
    frequency: RecurringFrequency;
    nextPaymentDate: string;
    category: string;
    type: TransactionType;
    isActive: boolean;
  }) => void;
  onToggleActive: (id: string) => void;
  onRecordPaymentNow: (item: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
}

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Co tydzień',
  monthly: 'Co miesiąc',
  quarterly: 'Co kwartał',
  annually: 'Co rok',
};

export function RecurringView({
  items,
  currency,
  onSaveRecurring,
  onToggleActive,
  onRecordPaymentNow,
  onDeleteRecurring,
}: RecurringViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextPaymentDate, setNextPaymentDate] = useState(toIsoDate(new Date()));
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Subskrypcje');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringTransaction | null>(null);

  const sorted = [...items].sort((a, b) =>
    a.nextPaymentDate.localeCompare(b.nextPaymentDate)
  );
  const monthlyEq = computeMonthlyRecurringEquivalent(items);
  const upcomingCount = items.filter((i) => i.isActive).length;

  const openCreate = () => {
    setEditing(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setNextPaymentDate(toIsoDate(new Date()));
    setType('expense');
    setCategory('Subskrypcje');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditing(item);
    setName(item.name);
    setAmount(String(item.amount));
    setFrequency(item.frequency);
    setNextPaymentDate(item.nextPaymentDate);
    setType(item.type);
    setCategory(item.category);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(amount.replace(',', '.'));
    if (name.trim().length < 2) {
      setError('Podaj nazwę subskrypcji lub płatności.');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setError('Kwota musi być większa od zera.');
      return;
    }
    if (!nextPaymentDate) {
      setError('Wybierz datę kolejnej płatności.');
      return;
    }

    onSaveRecurring({
      id: editing?.id,
      name: name.trim(),
      amount: Number(num.toFixed(2)),
      frequency,
      nextPaymentDate,
      category,
      type,
      isActive: editing ? editing.isActive : true,
    });
    setModalOpen(false);
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Płatności cykliczne
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Zarządzaj subskrypcjami, rachunkami i stałymi zobowiązaniami
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Dodaj płatność cykliczną
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Aktywne subskrypcje i rachunki
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {upcomingCount}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Średnie miesięczne obciążenie
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-rose-500 tabular-nums">
            {formatCurrency(monthlyEq.monthlyExpenses, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Szacowany koszt roczny
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(monthlyEq.monthlyExpenses * 12, currency)}
          </p>
        </div>
      </div>

      {/* Recurring Table / List */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Brak skonfigurowanych płatności cyklicznych.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/6">
            {sorted.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity ${
                  item.isActive ? '' : 'opacity-55'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-200">
                    <CategoryIcon category={item.category} className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      {!item.isActive && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          · Wstrzymana
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{FREQUENCY_LABELS[item.frequency]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Następna: {formatDatePL(item.nextPaymentDate)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0">
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums ${
                      item.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount, currency)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRecordPaymentNow(item)}
                      disabled={!item.isActive}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 disabled:opacity-40 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors whitespace-nowrap"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Zaksięguj
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(item.id)}
                      className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 whitespace-nowrap"
                    >
                      {item.isActive ? 'Wstrzymaj' : 'Wznów'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      aria-label={`Edytuj płatność ${item.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={`Usuń płatność ${item.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rec-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/8">
              <h3
                id="rec-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-white"
              >
                {editing ? 'Edytuj płatność cykliczną' : 'Nowa płatność cykliczna'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Zamknij formularz płatności"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-500">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategory('Subskrypcje');
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold ${
                    type === 'expense'
                      ? 'bg-white dark:bg-[#1C2530] text-rose-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Wydatek stały
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('Wynagrodzenie');
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold ${
                    type === 'income'
                      ? 'bg-white dark:bg-[#1C2530] text-emerald-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Przychód stały
                </button>
              </div>

              <div>
                <label
                  htmlFor="rec-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Nazwa subskrypcji / płatności
                </label>
                <input
                  id="rec-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Np. Netflix Premium"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rec-amount"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kwota ({currency})
                  </label>
                  <input
                    id="rec-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rec-freq"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Częstotliwość
                  </label>
                  <select
                    id="rec-freq"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="weekly">Co tydzień</option>
                    <option value="monthly">Co miesiąc</option>
                    <option value="quarterly">Co kwartał</option>
                    <option value="annually">Co rok</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rec-date"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Data kolejnej płatności
                  </label>
                  <input
                    id="rec-date"
                    type="date"
                    required
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rec-cat"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kategoria
                  </label>
                  <select
                    id="rec-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  {editing ? 'Zapisz zmiany' : 'Dodaj płatność'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Usunąć płatność cykliczną?"
        description={
          pendingDelete
            ? `Czy na pewno chcesz usunąć „${pendingDelete.name}”?`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDeleteRecurring(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
