export type CurrencyCode = 'PLN' | 'EUR' | 'USD' | 'GBP';
export type ThemeMode = 'dark' | 'light';
export type LanguageCode = 'pl' | 'en';
export type TransactionType = 'income' | 'expense';

export const EXPENSE_CATEGORIES = [
  'Jedzenie',
  'Transport',
  'Mieszkanie',
  'Zakupy',
  'Rozrywka',
  'Zdrowie',
  'Edukacja',
  'Subskrypcje',
  'Podróże',
  'Inne',
] as const;

export const INCOME_CATEGORIES = [
  'Wynagrodzenie',
  'Freelance',
  'Biznes',
  'Inwestycje',
  'Prezenty',
  'Inne',
] as const;

export const PAYMENT_METHODS = [
  'Karta debetowa',
  'BLIK',
  'Przelew bankowy',
  'Gotówka',
  'Karta kredytowa',
  'Apple Pay / Google Pay',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type TransactionCategory = ExpenseCategory | IncomeCategory;

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export type GoalIconKey = 'car' | 'plane' | 'laptop' | 'shield' | 'home' | 'target';

export type NavigationTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'goals'
  | 'analytics'
  | 'recurring'
  | 'ai'
  | 'notifications'
  | 'settings';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  passwordHash: string;
  isDemoAccount?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  userId: string;
  currency: CurrencyCode;
  language: LanguageCode;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  recurringRemindersEnabled: boolean;
  goalMilestonesEnabled: boolean;
  aiInsightsEnabled: boolean;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  description: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  description: string;
  icon: GoalIconKey;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  nextPaymentDate: string; // YYYY-MM-DD
  category: string;
  type: TransactionType;
  isActive: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationKind = 'budget' | 'recurring' | 'goal' | 'summary' | 'ai';
export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  read: boolean;
  dedupeKey?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
