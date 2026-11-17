import type {
  AppNotification,
  Budget,
  CurrencyCode,
  RecurringFrequency,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  TransactionType,
  UserSettings,
} from '../types/finance';

export const CATEGORY_COLORS: Record<string, string> = {
  Jedzenie: '#10B981',
  Mieszkanie: '#3B82F6',
  Transport: '#F59E0B',
  Zakupy: '#EC4899',
  Rozrywka: '#8B5CF6',
  Zdrowie: '#EF4444',
  Edukacja: '#06B6D4',
  Subskrypcje: '#6366F1',
  Podróże: '#14B8A6',
  Inne: '#64748B',
  Wynagrodzenie: '#10B981',
  Freelance: '#3B82F6',
  Biznes: '#0EA5E9',
  Inwestycje: '#22C55E',
  Prezenty: '#A855F7',
};

const POLISH_MONTHS_SHORT = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

const POLISH_MONTHS_FULL = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthKey(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 7);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return getMonthKey(d);
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'PLN'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'PLN'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safe);
  if (abs >= 1000) {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safe);
  }
  return formatCurrency(safe, currency);
}

export function formatDatePL(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return `${d} ${POLISH_MONTHS_SHORT[m - 1] ?? ''} ${y}`;
}

export function formatFullDatePL(date: Date): string {
  const day = date.getDate();
  const month = POLISH_MONTHS_FULL[date.getMonth()] ?? '';
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatMonthLabelPL(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return `${POLISH_MONTHS_SHORT[(m || 1) - 1] ?? ''} ${String(y).slice(-2)}`;
}

export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export interface DashboardMetrics {
  totalBalance: number;
  previousBalance: number;
  balanceChangePct: number | null;
  monthlyIncome: number;
  previousMonthlyIncome: number;
  incomeChangePct: number | null;
  monthlyExpenses: number;
  previousMonthlyExpenses: number;
  expensesChangePct: number | null;
  monthlySavings: number;
  previousMonthlySavings: number;
  savingsChangePct: number | null;
  currentMonthKey: string;
}

export function computeDashboardMetrics(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): DashboardMetrics {
  const currentMonthKey = getMonthKey(referenceDate);
  const previousMonthKey = shiftMonthKey(currentMonthKey, -1);

  let totalBalance = 0;
  let previousBalance = 0;
  let monthlyIncome = 0;
  let previousMonthlyIncome = 0;
  let monthlyExpenses = 0;
  let previousMonthlyExpenses = 0;

  for (const tx of transactions) {
    const signed = tx.type === 'income' ? tx.amount : -tx.amount;
    const txMonth = getMonthKey(tx.date);

    totalBalance += signed;
    if (txMonth <= previousMonthKey) {
      previousBalance += signed;
    }

    if (txMonth === currentMonthKey) {
      if (tx.type === 'income') monthlyIncome += tx.amount;
      else monthlyExpenses += tx.amount;
    } else if (txMonth === previousMonthKey) {
      if (tx.type === 'income') previousMonthlyIncome += tx.amount;
      else previousMonthlyExpenses += tx.amount;
    }
  }

  const monthlySavings = monthlyIncome - monthlyExpenses;
  const previousMonthlySavings = previousMonthlyIncome - previousMonthlyExpenses;

  return {
    totalBalance,
    previousBalance,
    balanceChangePct: calculatePercentageChange(totalBalance, previousBalance),
    monthlyIncome,
    previousMonthlyIncome,
    incomeChangePct: calculatePercentageChange(monthlyIncome, previousMonthlyIncome),
    monthlyExpenses,
    previousMonthlyExpenses,
    expensesChangePct: calculatePercentageChange(monthlyExpenses, previousMonthlyExpenses),
    monthlySavings,
    previousMonthlySavings,
    savingsChangePct: calculatePercentageChange(monthlySavings, previousMonthlySavings),
    currentMonthKey,
  };
}

export interface MonthlySeriesPoint {
  monthKey: string;
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export function computeMonthlySeries(
  transactions: Transaction[],
  monthsCount: number = 6,
  referenceDate: Date = new Date()
): MonthlySeriesPoint[] {
  const currentMonth = getMonthKey(referenceDate);
  const months: string[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    months.push(shiftMonthKey(currentMonth, -i));
  }

  const map = new Map<string, { income: number; expenses: number }>();
  for (const m of months) {
    map.set(m, { income: 0, expenses: 0 });
  }

  for (const tx of transactions) {
    const m = getMonthKey(tx.date);
    const bucket = map.get(m);
    if (!bucket) continue;
    if (tx.type === 'income') bucket.income += tx.amount;
    else bucket.expenses += tx.amount;
  }

  return months.map((monthKey) => {
    const entry = map.get(monthKey)!;
    return {
      monthKey,
      label: formatMonthLabelPL(monthKey),
      income: Number(entry.income.toFixed(2)),
      expenses: Number(entry.expenses.toFixed(2)),
      savings: Number((entry.income - entry.expenses).toFixed(2)),
    };
  });
}

export interface CategorySlice {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  type: TransactionType = 'expense',
  monthKey?: string
): CategorySlice[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (monthKey && getMonthKey(tx.date) !== monthKey) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    grandTotal += tx.amount;
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: grandTotal > 0 ? Number(((amount / grandTotal) * 100).toFixed(1)) : 0,
      color: CATEGORY_COLORS[category] ?? '#64748B',
    }));
}

export type BudgetAlertLevel = 'ok' | 'info_50' | 'warning_75' | 'danger_90' | 'exceeded';

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  alertLevel: BudgetAlertLevel;
  alertLabel: string;
}

export function getBudgetAlertLevel(percentage: number): {
  level: BudgetAlertLevel;
  label: string;
} {
  if (percentage > 100) {
    return { level: 'exceeded', label: 'Budżet przekroczony' };
  }
  if (percentage >= 90) {
    return { level: 'danger_90', label: 'Przekroczono 90% limitu' };
  }
  if (percentage >= 75) {
    return { level: 'warning_75', label: 'Wykorzystano ≥75% limitu' };
  }
  if (percentage >= 50) {
    return { level: 'info_50', label: 'Wykorzystano ≥50% limitu' };
  }
  return { level: 'ok', label: 'W normie' };
}

export function computeBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string
): BudgetStatus[] {
  const spentByCat = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (getMonthKey(tx.date) !== monthKey) continue;
    spentByCat.set(tx.category, (spentByCat.get(tx.category) ?? 0) + tx.amount);
  }

  return budgets
    .filter((b) => b.month === monthKey)
    .map((budget) => {
      const spent = Number((spentByCat.get(budget.category) ?? 0).toFixed(2));
      const remaining = Number((budget.limit - spent).toFixed(2));
      const percentage =
        budget.limit > 0 ? Number(((spent / budget.limit) * 100).toFixed(1)) : 0;
      const alert = getBudgetAlertLevel(percentage);
      return {
        budget,
        spent,
        remaining,
        percentage,
        alertLevel: alert.level,
        alertLabel: alert.label,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export interface GoalProjection {
  progressPct: number;
  remainingAmount: number;
  monthsRemaining: number;
  suggestedMonthlyContribution: number;
  estimatedCompletionDate: string;
  isCompleted: boolean;
}

export function computeGoalProjection(
  goal: SavingsGoal,
  referenceDate: Date = new Date()
): GoalProjection {
  const target = Math.max(goal.targetAmount, 0);
  const current = Math.max(goal.currentAmount, 0);
  const remainingAmount = Math.max(Number((target - current).toFixed(2)), 0);
  const progressPct =
    target > 0 ? Math.min(100, Number(((current / target) * 100).toFixed(1))) : 100;
  const isCompleted = remainingAmount <= 0;

  const targetDt = new Date(`${goal.targetDate}T00:00:00`);
  const diffDays = Math.max(
    1,
    Math.ceil((targetDt.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.4375));
  const suggestedMonthlyContribution = isCompleted
    ? 0
    : Number((remainingAmount / monthsRemaining).toFixed(2));

  const estimatedCompletionDate = isCompleted
    ? toIsoDate(referenceDate)
    : goal.targetDate;

  return {
    progressPct,
    remainingAmount,
    monthsRemaining,
    suggestedMonthlyContribution,
    estimatedCompletionDate,
    isCompleted,
  };
}

export function computeNextPaymentDate(
  currentDate: string,
  frequency: RecurringFrequency
): string {
  const dt = new Date(`${currentDate}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return currentDate;

  switch (frequency) {
    case 'weekly':
      dt.setDate(dt.getDate() + 7);
      break;
    case 'monthly':
      dt.setMonth(dt.getMonth() + 1);
      break;
    case 'quarterly':
      dt.setMonth(dt.getMonth() + 3);
      break;
    case 'annually':
      dt.setFullYear(dt.getFullYear() + 1);
      break;
  }
  return toIsoDate(dt);
}

export function computeMonthlyRecurringEquivalent(items: RecurringTransaction[]): {
  monthlyExpenses: number;
  monthlyIncome: number;
} {
  const factor: Record<RecurringFrequency, number> = {
    weekly: 52 / 12,
    monthly: 1,
    quarterly: 1 / 3,
    annually: 1 / 12,
  };

  let monthlyExpenses = 0;
  let monthlyIncome = 0;

  for (const item of items) {
    if (!item.isActive) continue;
    const eq = item.amount * factor[item.frequency];
    if (item.type === 'expense') monthlyExpenses += eq;
    else monthlyIncome += eq;
  }

  return {
    monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
  };
}

export interface TransactionFilterOptions {
  search?: string;
  category?: string;
  type?: 'all' | TransactionType;
  dateFrom?: string;
  dateTo?: string;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilterOptions
): Transaction[] {
  const q = (filters.search || '').trim().toLowerCase();
  return transactions.filter((tx) => {
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.category && filters.category !== 'all' && tx.category !== filters.category)
      return false;
    if (filters.dateFrom && tx.date < filters.dateFrom) return false;
    if (filters.dateTo && tx.date > filters.dateTo) return false;
    if (q) {
      const hay = `${tx.name} ${tx.category} ${tx.description} ${tx.notes || ''} ${tx.paymentMethod}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortTransactions(
  transactions: Transaction[],
  sortBy: 'date' | 'amount',
  sortDir: 'asc' | 'desc'
): Transaction[] {
  const copy = [...transactions];
  copy.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') {
      cmp = a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
    } else {
      cmp = a.amount - b.amount;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return copy;
}

export type AnalyticsRange = '7d' | '30d' | '3m' | '6m' | '12m' | 'custom';

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  averageDailySpending: number;
  averageMonthlySpending: number;
  mostExpensiveCategory: { category: string; amount: number } | null;
  filteredTransactions: Transaction[];
  monthlySeries: MonthlySeriesPoint[];
  categoryBreakdown: CategorySlice[];
  dayCount: number;
}

export function getAnalyticsDateBounds(
  range: AnalyticsRange,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): { start: string; end: string; dayCount: number } {
  const end = customEnd && range === 'custom' ? customEnd : toIsoDate(referenceDate);
  const endDate = new Date(`${end}T00:00:00`);

  let startDate = new Date(endDate);
  if (range === '7d') startDate.setDate(startDate.getDate() - 6);
  else if (range === '30d') startDate.setDate(startDate.getDate() - 29);
  else if (range === '3m') startDate.setMonth(startDate.getMonth() - 3);
  else if (range === '6m') startDate.setMonth(startDate.getMonth() - 6);
  else if (range === '12m') startDate.setMonth(startDate.getMonth() - 12);
  else if (range === 'custom' && customStart) {
    startDate = new Date(`${customStart}T00:00:00`);
  }

  const start = toIsoDate(startDate);
  const dayCount = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  return { start, end, dayCount };
}

export function computeAnalytics(
  transactions: Transaction[],
  range: AnalyticsRange,
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): AnalyticsSummary {
  const { start, end, dayCount } = getAnalyticsDateBounds(
    range,
    customStart,
    customEnd,
    referenceDate
  );

  const filtered = transactions.filter((tx) => tx.date >= start && tx.date <= end);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const tx of filtered) {
    if (tx.type === 'income') totalIncome += tx.amount;
    else totalExpenses += tx.amount;
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0;
  const averageDailySpending = Number((totalExpenses / dayCount).toFixed(2));
  const approxMonths = Math.max(1, dayCount / 30.4375);
  const averageMonthlySpending = Number((totalExpenses / approxMonths).toFixed(2));

  const categoryBreakdown = computeCategoryBreakdown(filtered, 'expense');
  const mostExpensiveCategory =
    categoryBreakdown.length > 0
      ? { category: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
      : null;

  const monthsToShow =
    range === '12m' ? 12 : range === '6m' ? 6 : range === '3m' ? 3 : 6;
  const monthlySeries = computeMonthlySeries(
    range === 'custom' || range === '7d' || range === '30d' ? transactions : filtered,
    monthsToShow,
    referenceDate
  );

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netSavings: Number(netSavings.toFixed(2)),
    savingsRate,
    averageDailySpending,
    averageMonthlySpending,
    mostExpensiveCategory,
    filteredTransactions: sortTransactions(filtered, 'date', 'desc'),
    monthlySeries,
    categoryBreakdown,
    dayCount,
  };
}

export function transactionsToCsv(
  transactions: Transaction[],
  currency: CurrencyCode
): string {
  const escape = (val: string | number | undefined) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const header = [
    'Data',
    'Nazwa',
    'Typ',
    'Kategoria',
    `Kwota (${currency})`,
    'Metoda płatności',
    'Opis',
    'Notatki',
  ].map(escape);

  const rows = transactions.map((tx) =>
    [
      tx.date,
      tx.name,
      tx.type === 'income' ? 'Przychód' : 'Wydatek',
      tx.category,
      tx.type === 'income' ? tx.amount.toFixed(2) : (-tx.amount).toFixed(2),
      tx.paymentMethod,
      tx.description,
      tx.notes || '',
    ]
      .map(escape)
      .join(';')
  );

  return '\uFEFF' + [header.join(';'), ...rows].join('\n');
}

export function generateIntelligentNotifications(
  userId: string,
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  recurring: RecurringTransaction[],
  settings: UserSettings,
  existing: AppNotification[],
  referenceDate: Date = new Date()
): AppNotification[] {
  if (!settings.notificationsEnabled) return existing;

  const existingKeys = new Set(existing.map((n) => n.dedupeKey).filter(Boolean));
  const created: AppNotification[] = [];
  const nowIso = referenceDate.toISOString();
  const currentMonth = getMonthKey(referenceDate);

  if (settings.budgetAlertsEnabled) {
    const statuses = computeBudgetStatuses(budgets, transactions, currentMonth);
    for (const st of statuses) {
      if (st.alertLevel === 'ok') continue;
      const dedupeKey = `budget:${currentMonth}:${st.budget.id}:${st.alertLevel}`;
      if (existingKeys.has(dedupeKey)) continue;

      const severity =
        st.alertLevel === 'exceeded' || st.alertLevel === 'danger_90'
          ? 'critical'
          : st.alertLevel === 'warning_75'
            ? 'warning'
            : 'info';

      created.push({
        id: `notif-${Math.random().toString(36).slice(2, 10)}`,
        userId,
        title: `Budżet: ${st.budget.category} (${st.percentage}%)`,
        message: `${st.alertLabel}. Wydano ${formatCurrency(st.spent, settings.currency)} z limitu ${formatCurrency(st.budget.limit, settings.currency)}.`,
        kind: 'budget',
        severity,
        read: false,
        dedupeKey,
        createdAt: nowIso,
      });
    }
  }

  if (settings.recurringRemindersEnabled) {
    const todayIso = toIsoDate(referenceDate);
    const inSevenDays = new Date(referenceDate);
    inSevenDays.setDate(inSevenDays.getDate() + 7);
    const maxIso = toIsoDate(inSevenDays);

    for (const item of recurring) {
      if (!item.isActive) continue;
      if (item.nextPaymentDate >= todayIso && item.nextPaymentDate <= maxIso) {
        const dedupeKey = `recurring:${item.id}:${item.nextPaymentDate}`;
        if (existingKeys.has(dedupeKey)) continue;
        created.push({
          id: `notif-${Math.random().toString(36).slice(2, 10)}`,
          userId,
          title: `Nadchodząca płatność: ${item.name}`,
          message: `Termin ${formatDatePL(item.nextPaymentDate)} · kwota ${formatCurrency(item.amount, settings.currency)} (${item.category}).`,
          kind: 'recurring',
          severity: 'info',
          read: false,
          dedupeKey,
          createdAt: nowIso,
        });
      }
    }
  }

  if (settings.goalMilestonesEnabled) {
    for (const goal of goals) {
      const proj = computeGoalProjection(goal, referenceDate);
      const milestone =
        proj.progressPct >= 100
          ? 100
          : proj.progressPct >= 75
            ? 75
            : proj.progressPct >= 50
              ? 50
              : 0;
      if (milestone === 0) continue;
      const dedupeKey = `goal:${goal.id}:${milestone}`;
      if (existingKeys.has(dedupeKey)) continue;
      created.push({
        id: `notif-${Math.random().toString(36).slice(2, 10)}`,
        userId,
        title:
          milestone === 100
            ? `Cel osiągnięty: ${goal.name}`
            : `Kamień milowy (${milestone}%): ${goal.name}`,
        message: `Zebrano ${formatCurrency(goal.currentAmount, settings.currency)} z docelowych ${formatCurrency(goal.targetAmount, settings.currency)}.`,
        kind: 'goal',
        severity: 'success',
        read: false,
        dedupeKey,
        createdAt: nowIso,
      });
    }
  }

  if (transactions.length > 0) {
    const metrics = computeDashboardMetrics(transactions, referenceDate);
    const dedupeKey = `summary:${currentMonth}:${Math.round(metrics.monthlyExpenses)}`;
    const hasSummaryForMonth = existing.some((n) =>
      n.dedupeKey?.startsWith(`summary:${currentMonth}:`)
    );
    if (!hasSummaryForMonth && !existingKeys.has(dedupeKey)) {
      created.push({
        id: `notif-${Math.random().toString(36).slice(2, 10)}`,
        userId,
        title: `Podsumowanie bieżącego miesiąca`,
        message: `Przychody: ${formatCurrency(metrics.monthlyIncome, settings.currency)} · Wydatki: ${formatCurrency(metrics.monthlyExpenses, settings.currency)} · Oszczędności: ${formatCurrency(metrics.monthlySavings, settings.currency)}.`,
        kind: 'summary',
        severity: metrics.monthlySavings >= 0 ? 'info' : 'warning',
        read: false,
        dedupeKey,
        createdAt: nowIso,
      });
    }
  }

  if (created.length === 0) return existing;
  return [...created, ...existing].slice(0, 60);
}

export function buildFinancialContextForAI(
  userName: string,
  currency: CurrencyCode,
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingsGoal[],
  recurring: RecurringTransaction[],
  referenceDate: Date = new Date()
): Record<string, unknown> {
  const metrics = computeDashboardMetrics(transactions, referenceDate);
  const currentMonth = metrics.currentMonthKey;
  const monthlySeries = computeMonthlySeries(transactions, 6, referenceDate);
  const currentMonthExpensesByCategory = computeCategoryBreakdown(
    transactions,
    'expense',
    currentMonth
  );
  const allTimeExpensesByCategory = computeCategoryBreakdown(transactions, 'expense');
  const budgetStatuses = computeBudgetStatuses(budgets, transactions, currentMonth).map(
    (b) => ({
      category: b.budget.category,
      limit: b.budget.limit,
      spent: b.spent,
      remaining: b.remaining,
      percentageUsed: b.percentage,
      status: b.alertLabel,
    })
  );

  const recentTransactions = sortTransactions(transactions, 'date', 'desc')
    .slice(0, 25)
    .map((tx) => ({
      date: tx.date,
      name: tx.name,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
    }));

  const recurringSummary = recurring.map((r) => ({
    name: r.name,
    amount: r.amount,
    frequency: r.frequency,
    nextPaymentDate: r.nextPaymentDate,
    category: r.category,
    type: r.type,
    isActive: r.isActive,
  }));

  const goalsSummary = goals.map((g) => {
    const p = computeGoalProjection(g, referenceDate);
    return {
      name: g.name,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      remainingAmount: p.remainingAmount,
      progressPct: p.progressPct,
      targetDate: g.targetDate,
      suggestedMonthlyContribution: p.suggestedMonthlyContribution,
    };
  });

  return {
    userName,
    currency,
    referenceDate: toIsoDate(referenceDate),
    currentMonth,
    totalTransactionsCount: transactions.length,
    summaryMetrics: {
      totalBalance: metrics.totalBalance,
      currentMonthIncome: metrics.monthlyIncome,
      currentMonthExpenses: metrics.monthlyExpenses,
      currentMonthSavings: metrics.monthlySavings,
      previousMonthIncome: metrics.previousMonthlyIncome,
      previousMonthExpenses: metrics.previousMonthlyExpenses,
      previousMonthSavings: metrics.previousMonthlySavings,
    },
    currentMonthExpensesByCategory,
    allTimeExpensesByCategory,
    monthlyHistoryLast6Months: monthlySeries,
    budgetsForCurrentMonth: budgetStatuses,
    savingsGoals: goalsSummary,
    recurringPayments: recurringSummary,
    recentTransactions,
  };
}
