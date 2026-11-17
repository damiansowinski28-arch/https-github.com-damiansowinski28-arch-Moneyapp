import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type Budget,
  type CurrencyCode,
  type Transaction,
} from '../types/finance';
import {
  computeBudgetStatuses,
  formatCurrency,
  getMonthKey,
} from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface BudgetsViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  currency: CurrencyCode;
  onSaveBudget: (data: { id?: string; category: string; limit: number; month: string }) => void;
  onDeleteBudget: (id: string) => void;
}

export function BudgetsView({
  budgets,
  transactions,
  currency,
  onSaveBudget,
  onDeleteBudget,
}: BudgetsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const statuses = computeBudgetStatuses(budgets, transactions, selectedMonth);
  const totalLimit = statuses.reduce((s, b) => s + b.budget.limit, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const totalPct = totalLimit > 0 ? Number(((totalSpent / totalLimit) * 100).toFixed(1)) : 0;

  const openCreate = () => {
    setEditing(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setLimit('');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setCategory(b.category);
    setLimit(String(b.limit));
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = Number(limit.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Limit budżetu musi być większy od zera.');
      return;
    }
    const duplicate = budgets.find(
      (b) => b.month === selectedMonth && b.category === category && b.id !== editing?.id
    );
    if (duplicate) {
      setError(`Budżet dla kategorii „${category}” w tym miesiącu już istnieje.`);
      return;
    }

    onSaveBudget({
      id: editing?.id,
      category,
      limit: Number(num.toFixed(2)),
      month: selectedMonth,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Budżety miesięczne
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Kontroluj limity wydatków i reaguj na inteligentne ostrzeżenia (50%, 75%, 90%, 100%)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            aria-label="Wybierz miesiąc budżetu"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141B23] px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Dodaj budżet
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Łączny limit budżetów
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalLimit, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Wydano w kategoriach budżetowych
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalSpent, currency)}{' '}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({totalPct}%)
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pozostało do wykorzystania
          </p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              totalRemaining >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500'
            }`}
          >
            {formatCurrency(totalRemaining, currency)}
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {statuses.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 py-14 px-6 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Brak budżetów dla wybranego miesiąca ({selectedMonth}).
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Utwórz pierwszy budżet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statuses.map((st) => {
            const barColor =
              st.alertLevel === 'exceeded' || st.alertLevel === 'danger_90'
                ? 'bg-rose-500'
                : st.alertLevel === 'warning_75'
                  ? 'bg-amber-500'
                  : st.alertLevel === 'info_50'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500';
            const textAlertColor =
              st.alertLevel === 'exceeded' || st.alertLevel === 'danger_90'
                ? 'text-rose-500'
                : st.alertLevel === 'warning_75'
                  ? 'text-amber-500'
                  : st.alertLevel === 'info_50'
                    ? 'text-blue-500'
                    : 'text-emerald-500';

            return (
              <div
                key={st.budget.id}
                className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-200">
                        <CategoryIcon category={st.budget.category} className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {st.budget.category}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          Limit: {formatCurrency(st.budget.limit, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(st.budget)}
                        aria-label={`Edytuj budżet ${st.budget.category}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(st.budget)}
                        aria-label={`Usuń budżet ${st.budget.category}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-xs mb-2">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        Wydano: {formatCurrency(st.spent, currency)}
                      </span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {st.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(100, st.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/6 flex items-center justify-between gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${textAlertColor}`}>
                    {st.alertLevel === 'ok' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {st.alertLabel}
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      st.remaining >= 0
                        ? 'text-slate-600 dark:text-slate-400'
                        : 'text-rose-500 font-semibold'
                    }`}
                  >
                    {st.remaining >= 0
                      ? `Pozostało ${formatCurrency(st.remaining, currency)}`
                      : `Przekroczono o ${formatCurrency(Math.abs(st.remaining), currency)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Budget Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/8">
              <h3
                id="budget-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-white"
              >
                {editing ? 'Edytuj budżet' : 'Nowy budżet kategorii'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Zamknij okno budżetu"
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

              <div>
                <label
                  htmlFor="budget-category"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Kategoria wydatków
                </label>
                <select
                  id="budget-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="budget-limit"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Miesięczny limit ({currency})
                </label>
                <input
                  id="budget-limit"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="Np. 1500"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
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
                  {editing ? 'Zapisz zmiany' : 'Utwórz budżet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Usunąć budżet?"
        description={
          pendingDelete
            ? `Czy na pewno chcesz usunąć budżet dla kategorii „${pendingDelete.category}”?`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDeleteBudget(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
