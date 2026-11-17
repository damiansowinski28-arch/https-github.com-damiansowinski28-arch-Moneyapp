import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CurrencyCode,
  type Transaction,
  type TransactionType,
} from '../types/finance';
import {
  filterTransactions,
  formatCurrency,
  formatDatePL,
  sortTransactions,
} from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface TransactionsViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionsView({
  transactions,
  currency,
  onAdd,
  onEdit,
  onDelete,
}: TransactionsViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const allCategories = useMemo(
    () => Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])),
    []
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterTransactions(transactions, {
      search,
      type: typeFilter,
      category: categoryFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    return sortTransactions(filtered, sortBy, sortDir);
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, sortBy, sortDir]);

  const totals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredAndSorted) {
      if (tx.type === 'income') inc += tx.amount;
      else exp += tx.amount;
    }
    return { income: inc, expense: exp };
  }, [filteredAndSorted]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('date');
    setSortDir('desc');
  };

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Transakcje
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Pełna historia przychodów i wydatków z wyszukiwaniem i filtrami
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nowa transakcja
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Szukaj transakcji"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po nazwie, opisie, metodzie..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filtruj po typie"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Wszystkie typy</option>
            <option value="expense">Tylko wydatki</option>
            <option value="income">Tylko przychody</option>
          </select>

          <select
            aria-label="Filtruj po kategorii"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Wszystkie kategorie</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resetuj filtry
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/6">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              Od:
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              Do:
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            <span>
              Wyniki: <strong className="font-mono">{filteredAndSorted.length}</strong>
            </span>
            <span>
              Przychody:{' '}
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totals.income, currency)}
              </strong>
            </span>
            <span>
              Wydatki:{' '}
              <strong className="font-mono text-rose-500">
                {formatCurrency(totals.expense, currency)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 overflow-hidden">
        {filteredAndSorted.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Brak transakcji spełniających wybrane kryteria.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Zmień filtry lub dodaj nową transakcję.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/8 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Transakcja</th>
                  <th className="py-3.5 px-4">Kategoria</th>
                  <th className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Data
                      <ArrowDownUp className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Metoda płatności</th>
                  <th className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Kwota
                      <ArrowDownUp className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/6 text-sm">
                {filteredAndSorted.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/12 text-emerald-500'
                              : 'bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <CategoryIcon category={tx.category} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {tx.name}
                          </p>
                          {(tx.description || tx.isDemo) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {tx.description}
                              {tx.description && tx.isDemo ? ' · ' : ''}
                              {tx.isDemo ? 'Demo' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                      {formatDatePL(tx.date)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          aria-label={`Edytuj transakcję ${tx.name}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(tx)}
                          aria-label={`Usuń transakcję ${tx.name}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Usunąć transakcję?"
        description={
          pendingDelete
            ? `Czy na pewno chcesz trwale usunąć „${pendingDelete.name}” (${formatCurrency(pendingDelete.amount, currency)})? Tej operacji nie można cofnąć.`
            : ''
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            onDelete(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
}
