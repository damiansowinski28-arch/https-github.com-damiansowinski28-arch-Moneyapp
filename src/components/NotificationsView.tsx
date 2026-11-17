import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarClock,
  CheckCheck,
  Info,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import type {
  AppNotification,
  Budget,
  CurrencyCode,
  NotificationKind,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { buildFinancialContextForAI, formatDatePL } from '../utils/finance';
import { fetchAiInsights } from '../services/aiClient';

interface NotificationsViewProps {
  userName: string;
  currency: CurrencyCode;
  notifications: AppNotification[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onAddAiNotifications: (
    items: Array<{ title: string; message: string; severity: 'info' | 'warning' | 'success' }>
  ) => void;
}

const KIND_LABELS: Record<'all' | NotificationKind, string> = {
  all: 'Wszystkie',
  budget: 'Budżety',
  recurring: 'Płatności cykliczne',
  goal: 'Cele',
  summary: 'Podsumowania',
  ai: 'Obserwacje AI',
};

export function NotificationsView({
  userName,
  currency,
  notifications,
  transactions,
  budgets,
  goals,
  recurring,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onAddAiNotifications,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState<'all' | NotificationKind>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = notifications.filter((n) => {
    if (filter !== 'all' && n.kind !== filter) return false;
    if (onlyUnread && n.read) return false;
    return true;
  });

  const handleGenerateAiInsights = async () => {
    setAiError(null);
    setLoadingAi(true);
    try {
      const context = buildFinancialContextForAI(
        userName,
        currency,
        transactions,
        budgets,
        goals,
        recurring
      );
      const insights = await fetchAiInsights(context);
      if (insights.length > 0) {
        onAddAiNotifications(insights);
      }
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Nie udało się wygenerować obserwacji AI.'
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const renderKindIcon = (kind: NotificationKind, severity: AppNotification['severity']) => {
    const colorClass =
      severity === 'critical'
        ? 'text-rose-500 bg-rose-500/12'
        : severity === 'warning'
          ? 'text-amber-500 bg-amber-500/12'
          : severity === 'success'
            ? 'text-emerald-500 bg-emerald-500/12'
            : 'text-blue-500 bg-blue-500/12';

    const Icon =
      kind === 'budget'
        ? AlertTriangle
        : kind === 'recurring'
          ? CalendarClock
          : kind === 'goal'
            ? Target
            : kind === 'ai'
              ? Bot
              : Info;

    return (
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Centrum powiadomień
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Alerty budżetowe, nadchodzące płatności, kamienie milowe i obserwacje AI
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={loadingAi}
            onClick={handleGenerateAiInsights}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 disabled:opacity-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {loadingAi ? 'Analizowanie...' : 'Generuj obserwacje AI'}
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141B23] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              Oznacz wszystkie jako przeczytane
            </button>
          )}
        </div>
      </div>

      {aiError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-500"
        >
          {aiError}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(KIND_LABELS) as Array<'all' | NotificationKind>).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                filter === k
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-[#0B0F14] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Tylko nieprzeczytane ({unreadCount})
        </label>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <Bell className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Brak powiadomień do wyświetlenia.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/6">
            {visible.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.read ? 'opacity-75' : 'bg-emerald-500/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {renderKindIcon(n.kind, n.severity)}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {KIND_LABELS[n.kind]}
                      </span>
                      {!n.read && (
                        <>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-semibold text-emerald-500">Nowe</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400 tabular-nums">
                      {formatDatePL(n.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(n.id)}
                      className="rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 whitespace-nowrap"
                    >
                      Oznacz jako przeczytane
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteNotification(n.id)}
                    aria-label={`Usuń powiadomienie ${n.title}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
