import { useState } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CurrencyCode, Transaction } from '../types/finance';
import {
  computeAnalytics,
  formatCompactCurrency,
  formatCurrency,
  toIsoDate,
  transactionsToCsv,
  type AnalyticsRange,
} from '../utils/finance';

interface AnalyticsViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onExportSuccess: () => void;
}

const RANGES: Array<{ id: AnalyticsRange; label: string }> = [
  { id: '7d', label: 'Ostatnie 7 dni' },
  { id: '30d', label: 'Ostatnie 30 dni' },
  { id: '3m', label: '3 miesiące' },
  { id: '6m', label: '6 miesięcy' },
  { id: '12m', label: '12 miesięcy' },
  { id: 'custom', label: 'Własny zakres' },
];

export function AnalyticsView({
  transactions,
  currency,
  onExportSuccess,
}: AnalyticsViewProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [range, setRange] = useState<AnalyticsRange>('6m');
  const [customStart, setCustomStart] = useState(toIsoDate(thirtyDaysAgo));
  const [customEnd, setCustomEnd] = useState(toIsoDate(today));

  const summary = computeAnalytics(transactions, range, customStart, customEnd);

  const handleExportCsv = () => {
    const csv = transactionsToCsv(summary.filteredTransactions, currency);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymind-raport-${range}-${toIsoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onExportSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Analityka i raporty
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Szczegółowa analiza przepływów, stopy oszczędności i trendów wydatkowych
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={summary.filteredTransactions.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141B23] hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4 text-emerald-500" />
          Eksportuj raport CSV
        </button>
      </div>

      {/* Range Selector */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                range === r.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-[#0B0F14] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              Od:
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              Do:
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </label>
          </div>
        )}
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Suma przychodów</p>
          <p className="mt-2 font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(summary.totalIncome, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Suma wydatków</p>
          <p className="mt-2 font-mono text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(summary.totalExpenses, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Oszczędności netto</p>
          <p
            className={`mt-2 font-mono text-xl font-semibold tabular-nums ${
              summary.netSavings >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-500'
            }`}
          >
            {formatCurrency(summary.netSavings, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Stopa oszczędności</p>
          <p className="mt-2 font-mono text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {summary.savingsRate}%
          </p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Średni wydatek dzienny ({summary.dayCount} dni)
          </p>
          <p className="mt-2 font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(summary.averageDailySpending, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Średni wydatek miesięczny</p>
          <p className="mt-2 font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(summary.averageMonthlySpending, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">Najdroższa kategoria</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.mostExpensiveCategory ? (
              <>
                {summary.mostExpensiveCategory.category}{' '}
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                  ({formatCurrency(summary.mostExpensiveCategory.amount, currency)})
                </span>
              </>
            ) : (
              'Brak wydatków'
            )}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1">
            Porównanie przychodów i wydatków
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Trend miesięczny w wybranym okresie
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.monthlySeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
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
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1">
            Wydatki według kategorii
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Ranking kategorii kosztowych w wybranym zakresie
          </p>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Brak wydatków w wybranym okresie.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.categoryBreakdown.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={96}
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
                      'Suma wydatków',
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {summary.categoryBreakdown.slice(0, 7).map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
