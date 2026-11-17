import { useState, type FormEvent } from 'react';
import {
  Calendar,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { CurrencyCode, GoalIconKey, SavingsGoal } from '../types/finance';
import {
  computeGoalProjection,
  formatCurrency,
  formatDatePL,
  toIsoDate,
} from '../utils/finance';
import { GoalIcon } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface GoalsViewProps {
  goals: SavingsGoal[];
  currency: CurrencyCode;
  onSaveGoal: (data: {
    id?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    description: string;
    icon: GoalIconKey;
  }) => void;
  onContributeGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
}

const GOAL_ICON_OPTIONS: Array<{ key: GoalIconKey; label: string }> = [
  { key: 'shield', label: 'Fundusz awaryjny' },
  { key: 'car', label: 'Nowy samochód' },
  { key: 'plane', label: 'Wakacje' },
  { key: 'laptop', label: 'Nowy komputer' },
  { key: 'home', label: 'Mieszkanie' },
  { key: 'target', label: 'Cel osobisty' },
];

export function GoalsView({
  goals,
  currency,
  onSaveGoal,
  onContributeGoal,
  onDeleteGoal,
}: GoalsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<GoalIconKey>('target');
  const [error, setError] = useState<string | null>(null);

  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribError, setContribError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavingsGoal | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  const openCreate = () => {
    const nextYear = new Date();
    nextYear.setMonth(nextYear.getMonth() + 6);
    setEditing(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(toIsoDate(nextYear));
    setDescription('');
    setIcon('target');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setCurrentAmount(String(g.currentAmount));
    setTargetDate(g.targetDate);
    setDescription(g.description);
    setIcon(g.icon);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const tAmt = Number(targetAmount.replace(',', '.'));
    const cAmt = Number(currentAmount.replace(',', '.'));
    if (name.trim().length < 2) {
      setError('Podaj nazwę celu (co najmniej 2 znaki).');
      return;
    }
    if (!Number.isFinite(tAmt) || tAmt <= 0) {
      setError('Kwota docelowa musi być większa od zera.');
      return;
    }
    if (!Number.isFinite(cAmt) || cAmt < 0) {
      setError('Aktualnie odłożona kwota nie może być ujemna.');
      return;
    }
    if (!targetDate) {
      setError('Wybierz docelową datę realizacji.');
      return;
    }

    onSaveGoal({
      id: editing?.id,
      name: name.trim(),
      targetAmount: Number(tAmt.toFixed(2)),
      currentAmount: Number(cAmt.toFixed(2)),
      targetDate,
      description: description.trim(),
      icon,
    });
    setModalOpen(false);
  };

  const handleContributeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!contribGoal) return;
    setContribError(null);
    const amt = Number(contribAmount.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      setContribError('Kwota wpłaty musi być większa od zera.');
      return;
    }
    onContributeGoal(contribGoal.id, Number(amt.toFixed(2)));
    setContribGoal(null);
    setContribAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Cele oszczędnościowe
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Planuj większe zakupy, poduszkę finansową i kontroluj miesięczne wpłaty
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nowy cel
        </button>
      </div>

      {/* Totals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Aktywne cele
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {goals.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Zebrane środki łącznie
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalSaved, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Łączna kwota docelowa
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalTarget, currency)}
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 py-14 px-6 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nie zdefiniowano jeszcze żadnych celów oszczędnościowych.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Dodaj pierwszy cel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map((g) => {
            const proj = computeGoalProjection(g);
            return (
              <div
                key={g.id}
                className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-500">
                        <GoalIcon icon={g.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {g.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Termin: {formatDatePL(g.targetDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(g)}
                        aria-label={`Edytuj cel ${g.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(g)}
                        aria-label={`Usuń cel ${g.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {g.description}
                    </p>
                  )}

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-xs mb-2">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(g.currentAmount, currency)}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        z {formatCurrency(g.targetAmount, currency)} ({proj.progressPct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${proj.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-white/6 text-xs">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Pozostało</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(proj.remainingAmount, currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Sugerowana wpłata / mies.</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatCurrency(proj.suggestedMonthlyContribution, currency)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500 dark:text-slate-400">Szacowane zakończenie</dt>
                      <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-300">
                        {proj.isCompleted
                          ? 'Cel osiągnięty!'
                          : `${formatDatePL(proj.estimatedCompletionDate)} (${proj.monthsRemaining} mies.)`}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  disabled={proj.isCompleted}
                  onClick={() => {
                    setContribGoal(g);
                    setContribAmount(
                      proj.suggestedMonthlyContribution > 0
                        ? String(Math.ceil(proj.suggestedMonthlyContribution))
                        : '500'
                    );
                    setContribError(null);
                  }}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
                >
                  <PiggyBank className="h-4 w-4" />
                  {proj.isCompleted ? 'Cel zrealizowany' : 'Wpłać środki'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/8">
              <h3
                id="goal-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-white"
              >
                {editing ? 'Edytuj cel oszczędnościowy' : 'Nowy cel oszczędnościowy'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Zamknij formularz celu"
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
                  htmlFor="goal-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Nazwa celu
                </label>
                <input
                  id="goal-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Np. Nowy samochód lub Wakacje"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="goal-target"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kwota docelowa ({currency})
                  </label>
                  <input
                    id="goal-target"
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="goal-current"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Aktualnie odłożono ({currency})
                  </label>
                  <input
                    id="goal-current"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="goal-date"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Docelowa data
                  </label>
                  <input
                    id="goal-date"
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="goal-icon"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kategoria ikony
                  </label>
                  <select
                    id="goal-icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value as GoalIconKey)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {GOAL_ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="goal-desc"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Opis
                </label>
                <textarea
                  id="goal-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Na co zbierasz te środki?"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none resize-none"
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
                  {editing ? 'Zapisz zmiany' : 'Utwórz cel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contribGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contrib-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/8">
              <h3
                id="contrib-modal-title"
                className="font-display text-lg font-semibold text-slate-900 dark:text-white"
              >
                Wpłać na cel: {contribGoal.name}
              </h3>
              <button
                type="button"
                onClick={() => setContribGoal(null)}
                aria-label="Zamknij okno wpłaty"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleContributeSubmit} className="mt-5 space-y-4">
              {contribError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-500">
                  {contribError}
                </div>
              )}

              <div>
                <label
                  htmlFor="contrib-amount"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Kwota wpłaty ({currency})
                </label>
                <input
                  id="contrib-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setContribGoal(null)}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Zatwierdź wpłatę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Usunąć cel oszczędnościowy?"
        description={
          pendingDelete
            ? `Czy na pewno chcesz usunąć cel „${pendingDelete.name}”?`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDeleteGoal(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
