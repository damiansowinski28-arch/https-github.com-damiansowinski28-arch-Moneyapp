import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalytics,
  computeBudgetStatuses,
  computeCategoryBreakdown,
  computeDashboardMetrics,
  computeGoalProjection,
  computeMonthlyRecurringEquivalent,
  computeMonthlySeries,
  computeNextPaymentDate,
  filterTransactions,
  generateIntelligentNotifications,
  sortTransactions,
  transactionsToCsv,
} from './finance';
import { createDemoBundle } from './demoData';
import type {
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserSettings,
} from '../types/finance';

const REF_DATE = new Date('2026-11-16T12:00:00Z');

const sampleSettings: UserSettings = {
  userId: 'u1',
  currency: 'PLN',
  language: 'pl',
  theme: 'dark',
  notificationsEnabled: true,
  budgetAlertsEnabled: true,
  recurringRemindersEnabled: true,
  goalMilestonesEnabled: true,
  aiInsightsEnabled: true,
  updatedAt: REF_DATE.toISOString(),
};

test('computeDashboardMetrics calculates totals and month-over-month comparisons accurately', () => {
  const txs: Transaction[] = [
    {
      id: '1',
      userId: 'u1',
      name: 'Pensja paź',
      amount: 8000,
      type: 'income',
      category: 'Wynagrodzenie',
      date: '2026-10-10',
      paymentMethod: 'Przelew bankowy',
      description: '',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    },
    {
      id: '2',
      userId: 'u1',
      name: 'Czynsz paź',
      amount: 3000,
      type: 'expense',
      category: 'Mieszkanie',
      date: '2026-10-05',
      paymentMethod: 'Przelew bankowy',
      description: '',
      createdAt: '2026-10-05T10:00:00Z',
      updatedAt: '2026-10-05T10:00:00Z',
    },
    {
      id: '3',
      userId: 'u1',
      name: 'Pensja lis',
      amount: 10000,
      type: 'income',
      category: 'Wynagrodzenie',
      date: '2026-11-10',
      paymentMethod: 'Przelew bankowy',
      description: '',
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
    },
    {
      id: '4',
      userId: 'u1',
      name: 'Jedzenie lis',
      amount: 1500,
      type: 'expense',
      category: 'Jedzenie',
      date: '2026-11-12',
      paymentMethod: 'Karta debetowa',
      description: '',
      createdAt: '2026-11-12T10:00:00Z',
      updatedAt: '2026-11-12T10:00:00Z',
    },
  ];

  const metrics = computeDashboardMetrics(txs, REF_DATE);
  assert.equal(metrics.totalBalance, 13500);
  assert.equal(metrics.previousBalance, 5000);
  assert.equal(metrics.monthlyIncome, 10000);
  assert.equal(metrics.previousMonthlyIncome, 8000);
  assert.equal(metrics.incomeChangePct, 25);
  assert.equal(metrics.monthlyExpenses, 1500);
  assert.equal(metrics.previousMonthlyExpenses, 3000);
  assert.equal(metrics.expensesChangePct, -50);
  assert.equal(metrics.monthlySavings, 8500);
  assert.equal(metrics.previousMonthlySavings, 5000);
  assert.equal(metrics.savingsChangePct, 70);
});

test('computeBudgetStatuses triggers 50%, 75%, 90%, and exceeded thresholds', () => {
  const budgets: Budget[] = [
    { id: 'b1', userId: 'u1', category: 'Jedzenie', limit: 1000, month: '2026-11', createdAt: '', updatedAt: '' },
    { id: 'b2', userId: 'u1', category: 'Transport', limit: 1000, month: '2026-11', createdAt: '', updatedAt: '' },
    { id: 'b3', userId: 'u1', category: 'Zakupy', limit: 1000, month: '2026-11', createdAt: '', updatedAt: '' },
    { id: 'b4', userId: 'u1', category: 'Rozrywka', limit: 1000, month: '2026-11', createdAt: '', updatedAt: '' },
  ];

  const txs: Transaction[] = [
    { id: 't1', userId: 'u1', name: 'A', amount: 550, type: 'expense', category: 'Jedzenie', date: '2026-11-05', paymentMethod: 'BLIK', description: '', createdAt: '', updatedAt: '' },
    { id: 't2', userId: 'u1', name: 'B', amount: 780, type: 'expense', category: 'Transport', date: '2026-11-06', paymentMethod: 'BLIK', description: '', createdAt: '', updatedAt: '' },
    { id: 't3', userId: 'u1', name: 'C', amount: 920, type: 'expense', category: 'Zakupy', date: '2026-11-07', paymentMethod: 'BLIK', description: '', createdAt: '', updatedAt: '' },
    { id: 't4', userId: 'u1', name: 'D', amount: 1120, type: 'expense', category: 'Rozrywka', date: '2026-11-08', paymentMethod: 'BLIK', description: '', createdAt: '', updatedAt: '' },
  ];

  const statuses = computeBudgetStatuses(budgets, txs, '2026-11');
  const byCat = Object.fromEntries(statuses.map((s) => [s.budget.category, s]));
  assert.equal(byCat['Jedzenie'].alertLevel, 'info_50');
  assert.equal(byCat['Transport'].alertLevel, 'warning_75');
  assert.equal(byCat['Zakupy'].alertLevel, 'danger_90');
  assert.equal(byCat['Rozrywka'].alertLevel, 'exceeded');
  assert.equal(byCat['Rozrywka'].remaining, -120);
});

test('computeGoalProjection calculates remaining amount and monthly contribution', () => {
  const goal: SavingsGoal = {
    id: 'g1',
    userId: 'u1',
    name: 'Nowy komputer',
    targetAmount: 10000,
    currentAmount: 4000,
    targetDate: '2027-05-16',
    description: 'Laptop',
    icon: 'laptop',
    createdAt: '',
    updatedAt: '',
  };

  const proj = computeGoalProjection(goal, REF_DATE);
  assert.equal(proj.progressPct, 40);
  assert.equal(proj.remainingAmount, 6000);
  assert.equal(proj.monthsRemaining, 6);
  assert.equal(proj.suggestedMonthlyContribution, 1000);
  assert.equal(proj.isCompleted, false);
});

test('computeNextPaymentDate and computeMonthlyRecurringEquivalent handle all frequencies', () => {
  assert.equal(computeNextPaymentDate('2026-11-16', 'weekly'), '2026-11-23');
  assert.equal(computeNextPaymentDate('2026-11-16', 'monthly'), '2026-12-16');
  assert.equal(computeNextPaymentDate('2026-11-16', 'quarterly'), '2027-02-16');
  assert.equal(computeNextPaymentDate('2026-11-16', 'annually'), '2027-11-16');

  const recurring: RecurringTransaction[] = [
    { id: 'r1', userId: 'u1', name: 'Netflix', amount: 60, frequency: 'monthly', nextPaymentDate: '2026-11-20', category: 'Subskrypcje', type: 'expense', isActive: true, createdAt: '', updatedAt: '' },
    { id: 'r2', userId: 'u1', name: 'Domena', amount: 120, frequency: 'annually', nextPaymentDate: '2026-12-01', category: 'Subskrypcje', type: 'expense', isActive: true, createdAt: '', updatedAt: '' },
    { id: 'r3', userId: 'u1', name: 'Inactive', amount: 500, frequency: 'monthly', nextPaymentDate: '2026-11-18', category: 'Inne', type: 'expense', isActive: false, createdAt: '', updatedAt: '' },
  ];

  const eq = computeMonthlyRecurringEquivalent(recurring);
  assert.equal(eq.monthlyExpenses, 70);
  assert.equal(eq.monthlyIncome, 0);
});

test('filterTransactions, sortTransactions, analytics, and CSV export work end-to-end', () => {
  const bundle = createDemoBundle('u1', REF_DATE);
  assert.ok(bundle.transactions.length >= 20);
  assert.equal(bundle.goals.length, 3);
  assert.ok(bundle.budgets.length >= 5);
  assert.ok(bundle.recurring.length >= 4);

  const onlyFood = filterTransactions(bundle.transactions, {
    type: 'expense',
    category: 'Jedzenie',
    search: 'Lidl',
  });
  assert.ok(onlyFood.length >= 2);
  assert.ok(onlyFood.every((t) => t.category === 'Jedzenie'));

  const sorted = sortTransactions(bundle.transactions, 'amount', 'desc');
  assert.ok(sorted[0].amount >= sorted[sorted.length - 1].amount);

  const analytics = computeAnalytics(bundle.transactions, '3m', undefined, undefined, REF_DATE);
  assert.ok(analytics.totalIncome > 0);
  assert.ok(analytics.totalExpenses > 0);
  assert.ok(analytics.mostExpensiveCategory !== null);

  const breakdown = computeCategoryBreakdown(bundle.transactions, 'expense', '2026-11');
  assert.ok(breakdown.length > 0);

  const monthlySeries = computeMonthlySeries(bundle.transactions, 6, REF_DATE);
  assert.equal(monthlySeries.length, 6);

  const csv = transactionsToCsv(onlyFood, 'PLN');
  assert.ok(csv.includes('Data'));
  assert.ok(csv.includes('Lidl'));
});

test('generateIntelligentNotifications creates budget, recurring, goal, and summary alerts without duplicates', () => {
  const bundle = createDemoBundle('u1', REF_DATE);
  const firstPass = generateIntelligentNotifications(
    'u1',
    bundle.transactions,
    bundle.budgets,
    bundle.goals,
    bundle.recurring,
    sampleSettings,
    [],
    REF_DATE
  );
  assert.ok(firstPass.length >= 4);

  const secondPass = generateIntelligentNotifications(
    'u1',
    bundle.transactions,
    bundle.budgets,
    bundle.goals,
    bundle.recurring,
    sampleSettings,
    firstPass,
    REF_DATE
  );
  assert.equal(secondPass.length, firstPass.length);
});
