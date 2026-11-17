import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  Budget,
  CurrencyCode,
  NavigationTab,
  Transaction,
} from '../types/finance';
import {
  computeBudgetStatuses,
  computeCategoryBreakdown,
  computeDashboardMetrics,
  computeMonthlySeries,
  formatCompactCurrency,
  formatCurrency,
  formatDatePL,
  sortTransactions,
} from '../utils/finance';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  currency: CurrencyCode;
  hasDemoData: boolean;
  onLoadDemoData: () => void;
  onClearDemoData: () => void;
  onAddTransaction: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

function ChangeBadge({
  pct,
  invertGood = false,
}: {
  pct: number | null;
  invertGood?: boolean;
}) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Minus className="h-3.5 w-3.5" />
        Brak danych z poprz. mies.
      </span>
    );
  }
  const isUp = pct > 0;
  const isFlat = pct === 0;
  const positiveColor = invertGood
    ? isUp
      ? 'text-rose-500'
      : 'text-emerald-500'
    : isUp
      ? 'text-emerald-500'
      : 'text-rose-500';

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${
        isFlat ? 'text-slate-500 dark:text-slate-400' : positiveColor
      }`}
    >
      {isFlat ? (
        <Minus className="h-3.5 w-3.5" />
      ) : isUp ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {pct > 0 ? `+${pct}%` : `${pct}%`} vs poprzedni mies.
    </span>
  );
}

export function DashboardView({
  transactions,
  budgets,
  currency,
  hasDemoData,
  onLoadDemoData,
  onClearDemoData,
  onAddTransaction,
  onNavigate,
}: DashboardViewProps) {
  const metrics = computeDashboardMetrics(transactions);
  const monthlySeries = computeMonthlySeries(transactions, 6);
  const categoryBreakdown = computeCategoryBreakdown(
    transactions,
    'expense',
    metrics.currentMonthKey
  );
  const budgetStatuses = computeBudgetStatuses(
    budgets,
    transactions,
    metrics.currentMonthKey
  );
  const recentTransactions = sortTransactions(transactions, 'date', 'desc').slice(0, 6);
  const totalCurrentExpenses = categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {hasDemoData ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/8 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              Przeglądasz zestaw <span className="font-semibold">danych demonstracyjnych</span>. Możesz dodawać własne wpisy lub usunąć dane przykładowe w dowolnej chwili.
            </p>
          </div>
          <button
            type="button"
            onClick={onClearDemoData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141B23] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            Usuń dane demo
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-6 py-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Twój pulpit jest gotowy na pierwsze dane
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dodaj pierwszą transakcję lub załaduj realistyczne dane przykładowe, aby od razu przetestować wykresy, budżety i asystenta MoneyMind AI.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onLoadDemoData}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-white dark:bg-[#141B23] px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              Załaduj dane demo
            </button>
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Dodaj transakcję
            </button>
          </div>
        </div>
      ) : null}

      {/* 4 Financial Summary Cards */}
      <section aria-label="Podsumowanie finansowe" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Saldo całkowite
          </p>
          <p className="mt-2 font-mono text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(metrics.totalBalance, currency)}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <ChangeBadge pct={metrics.balanceChangePct} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 tabular-nums">
            Poprzednio: {formatCurrency(metrics.previousBalance, currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Przychody w tym miesiącu
          </p>
          <p className="mt-2 font-mono text-2xl sm:text-[26px] font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(metrics.monthlyIncome, currency)}
          </p>
          <div className="mt-3">
            <ChangeBadge pct={metrics.incomeChangePct} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 tabular-nums">
            Poprzedni mies.: {formatCurrency(metrics.previousMonthlyIncome, currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Wydatki w tym miesiącu
          </p>
          <p className="mt-2 font-mono text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(metrics.monthlyExpenses, currency)}
          </p>
          <div className="mt-3">
            <ChangeBadge pct={metrics.expensesChangePct} invertGood />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 tabular-nums">
            Poprzedni mies.: {formatCurrency(metrics.previousMonthlyExpenses, currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Oszczędności w tym miesiącu
          </p>
          <p
            className={`mt-2 font-mono text-2xl sm:text-[26px] font-semibold tracking-tight tabular-nums ${
              metrics.monthlySavings >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-500'
            }`}
          >
            {formatCurrency(metrics.monthlySavings, currency)}
          </p>
          <div className="mt-3">
            <ChangeBadge pct={metrics.savingsChangePct} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500 tabular-nums">
            Poprzedni mies.: {formatCurrency(metrics.previousMonthlySavings, currency)}
          </p>
        </div>
      </section>

      {/* Charts Row: A (Line Chart) + B (Donut Chart) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* A. Income vs Expenses Line Chart */}
        <div className="xl:col-span-2 rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Przychody vs Wydatki
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historia finansowa z ostatnich 6 miesięcy
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                Przychody
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-500" />
                Wydatki
              </span>
            </div>
          </div>

          <div className="h-64 w-full" data-testid="chart-income-expenses">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E131A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown, name: unknown) => [
                    formatCurrency(Number(value), currency),
                    name === 'income' ? 'Przychody' : 'Wydatki',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#10B981' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#3B82F6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. Spending Distribution Donut Chart */}
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Struktura wydatków
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Podział według kategorii w bieżącym miesiącu
            </p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brak wydatków w bieżącym miesiącu.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="relative h-48 w-full" data-testid="chart-spending-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={54}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0E131A',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(value: unknown) => formatCurrency(Number(value), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Suma</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatCompactCurrency(totalCurrentExpenses, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {categoryBreakdown.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.category}</span>
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white tabular-nums shrink-0 ml-2">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: C (Monthly Savings Bar Chart) + E (Budget Progress) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* C. Monthly Savings Bar Chart */}
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Miesięczne oszczędności
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Różnica między przychodami a wydatkami netto
            </p>
          </div>
          <div className="h-60 w-full" data-testid="chart-monthly-savings">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E131A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [
                    formatCurrency(Number(value), currency),
                    'Oszczędności',
                  ]}
                />
                <Bar dataKey="savings" radius={[8, 8, 0, 0]}>
                  {monthlySeries.map((entry) => (
                    <Cell
                      key={entry.monthKey}
                      fill={entry.savings >= 0 ? '#10B981' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* E. Budget Progress */}
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Realizacja budżetów
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Postęp kategorii w bieżącym miesiącu
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('budgets')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              Zarządzaj
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {budgetStatuses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nie utworzono jeszcze budżetów na ten miesiąc.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Skonfiguruj budżety
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetStatuses.slice(0, 5).map((st) => {
                const barColor =
                  st.alertLevel === 'exceeded' || st.alertLevel === 'danger_90'
                    ? 'bg-rose-500'
                    : st.alertLevel === 'warning_75'
                      ? 'bg-amber-500'
                      : st.alertLevel === 'info_50'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500';
                const statusColor =
                  st.alertLevel === 'exceeded' || st.alertLevel === 'danger_90'
                    ? 'text-rose-500'
                    : st.alertLevel === 'warning_75'
                      ? 'text-amber-500'
                      : 'text-slate-500 dark:text-slate-400';

                return (
                  <div key={st.budget.id}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {st.budget.category}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatCurrency(st.spent, currency)} / {formatCurrency(st.budget.limit, currency)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(100, st.percentage)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className={statusColor}>{st.alertLabel}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {st.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* D. Recent Transactions */}
      <section className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Ostatnie transakcje
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Najnowsze przychody i wydatki na Twoim koncie
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
          >
            Wszystkie transakcje
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Brak zarejestrowanych transakcji.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/6">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/12 text-emerald-500'
                        : 'bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CategoryIcon category={tx.category} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {tx.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tx.category} · {formatDatePL(tx.date)} · {tx.paymentMethod}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
