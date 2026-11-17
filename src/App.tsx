import { useCallback, useEffect, useState } from 'react';
import {
  type AppNotification,
  type Budget,
  type ChatMessage,
  type GoalIconKey,
  type NavigationTab,
  type RecurringFrequency,
  type RecurringTransaction,
  type SavingsGoal,
  type ToastMessage,
  type Transaction,
  type TransactionType,
  type UserProfile,
  type UserSettings,
} from './types/finance';
import {
  changeUserPassword,
  createDefaultSettings,
  createStoreWithDemoData,
  deleteUserAccount,
  ensureAndLoginDemoUser,
  getCurrentSessionUser,
  loadUserStore,
  saveUserStore,
  setCurrentSessionUserId,
  updateUserProfile,
  type UserFinancialStore,
} from './services/storage';
import {
  computeNextPaymentDate,
  generateIntelligentNotifications,
  toIsoDate,
  transactionsToCsv,
} from './utils/finance';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { RecurringView } from './components/RecurringView';
import { AiAssistantView } from './components/AiAssistantView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { ToastContainer } from './components/ToastContainer';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [store, setStore] = useState<UserFinancialStore | null>(null);
  const [booting, setBooting] = useState(true);

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = makeId('toast');
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Boot session or handle ?autostart=1 for immediate demo access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    let sessionUser = getCurrentSessionUser();
    if (!sessionUser && autostart) {
      sessionUser = ensureAndLoginDemoUser();
    }
    if (sessionUser) {
      setUser(sessionUser);
      setStore(loadUserStore(sessionUser.id));
    }
    setBooting(false);
  }, []);

  // Synchronize dark/light theme class on <html>
  useEffect(() => {
    const theme = store?.settings.theme ?? 'dark';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [store?.settings.theme]);

  const commitStore = useCallback(
    (
      updater: (prev: UserFinancialStore) => UserFinancialStore,
      refreshAlerts: boolean = true
    ) => {
      if (!user) return;
      setStore((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        const notifications = refreshAlerts
          ? generateIntelligentNotifications(
              user.id,
              next.transactions,
              next.budgets,
              next.goals,
              next.recurring,
              next.settings,
              next.notifications
            )
          : next.notifications;
        const finalized = { ...next, notifications };
        saveUserStore(user.id, finalized);
        return finalized;
      });
    },
    [user]
  );

  const handleAuthenticated = (loggedUser: UserProfile) => {
    setUser(loggedUser);
    const loaded = loadUserStore(loggedUser.id);
    const refreshed = {
      ...loaded,
      notifications: generateIntelligentNotifications(
        loggedUser.id,
        loaded.transactions,
        loaded.budgets,
        loaded.goals,
        loaded.recurring,
        loaded.settings,
        loaded.notifications
      ),
    };
    saveUserStore(loggedUser.id, refreshed);
    setStore(refreshed);
    setActiveTab('dashboard');
    pushToast({
      type: 'success',
      title: `Witaj, ${loggedUser.name.split(/\s+/)[0]}!`,
      description: 'Twoje finanse zostały wczytane.',
    });
  };

  const handleLogout = () => {
    setCurrentSessionUserId(null);
    setUser(null);
    setStore(null);
    setActiveTab('dashboard');
    document.documentElement.classList.add('dark');
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-sm text-slate-400">
        Ładowanie platformy MoneyMind...
      </div>
    );
  }

  if (!user || !store) {
    return (
      <>
        <AuthScreen onAuthenticated={handleAuthenticated} />
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
        />
      </>
    );
  }

  const hasDemoData =
    store.transactions.some((t) => t.isDemo) ||
    store.budgets.some((b) => b.isDemo) ||
    store.goals.some((g) => g.isDemo) ||
    store.recurring.some((r) => r.isDemo);

  const unreadNotifications = store.notifications.filter((n) => !n.read).length;

  // Handlers
  const handleSaveTransaction = (data: {
    id?: string;
    name: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    paymentMethod: string;
    description: string;
    notes?: string;
  }) => {
    const now = new Date().toISOString();
    if (data.id) {
      commitStore((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === data.id ? { ...tx, ...data, updatedAt: now } : tx
        ),
      }));
      pushToast({ type: 'success', title: 'Zaktualizowano transakcję' });
    } else {
      const created: Transaction = {
        id: makeId('tx'),
        userId: user.id,
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        paymentMethod: data.paymentMethod,
        description: data.description,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };
      commitStore((prev) => ({
        ...prev,
        transactions: [created, ...prev.transactions],
      }));
      pushToast({ type: 'success', title: 'Dodano nową transakcję' });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    commitStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    pushToast({ type: 'info', title: 'Transakcja została usunięta' });
  };

  const handleSaveBudget = (data: {
    id?: string;
    category: string;
    limit: number;
    month: string;
  }) => {
    const now = new Date().toISOString();
    if (data.id) {
      commitStore((prev) => ({
        ...prev,
        budgets: prev.budgets.map((b) =>
          b.id === data.id ? { ...b, ...data, updatedAt: now } : b
        ),
      }));
      pushToast({ type: 'success', title: 'Zaktualizowano budżet' });
    } else {
      const created: Budget = {
        id: makeId('bdg'),
        userId: user.id,
        category: data.category,
        limit: data.limit,
        month: data.month,
        createdAt: now,
        updatedAt: now,
      };
      commitStore((prev) => ({
        ...prev,
        budgets: [...prev.budgets, created],
      }));
      pushToast({ type: 'success', title: 'Dodano nowy budżet' });
    }
  };

  const handleDeleteBudget = (id: string) => {
    commitStore((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
    pushToast({ type: 'info', title: 'Budżet został usunięty' });
  };

  const handleSaveGoal = (data: {
    id?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    description: string;
    icon: GoalIconKey;
  }) => {
    const now = new Date().toISOString();
    if (data.id) {
      commitStore((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === data.id ? { ...g, ...data, updatedAt: now } : g
        ),
      }));
      pushToast({ type: 'success', title: 'Zaktualizowano cel oszczędnościowy' });
    } else {
      const created: SavingsGoal = {
        id: makeId('goal'),
        userId: user.id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      commitStore((prev) => ({
        ...prev,
        goals: [...prev.goals, created],
      }));
      pushToast({ type: 'success', title: 'Utworzono nowy cel oszczędnościowy' });
    }
  };

  const handleContributeGoal = (goalId: string, amount: number) => {
    const now = new Date().toISOString();
    commitStore((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              currentAmount: Number((g.currentAmount + amount).toFixed(2)),
              updatedAt: now,
            }
          : g
      ),
    }));
    pushToast({ type: 'success', title: 'Zaksięgowano wpłatę na cel' });
  };

  const handleDeleteGoal = (id: string) => {
    commitStore((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
    pushToast({ type: 'info', title: 'Cel został usunięty' });
  };

  const handleSaveRecurring = (data: {
    id?: string;
    name: string;
    amount: number;
    frequency: RecurringFrequency;
    nextPaymentDate: string;
    category: string;
    type: TransactionType;
    isActive: boolean;
  }) => {
    const now = new Date().toISOString();
    if (data.id) {
      commitStore((prev) => ({
        ...prev,
        recurring: prev.recurring.map((r) =>
          r.id === data.id ? { ...r, ...data, updatedAt: now } : r
        ),
      }));
      pushToast({ type: 'success', title: 'Zaktualizowano płatność cykliczną' });
    } else {
      const created: RecurringTransaction = {
        id: makeId('rec'),
        userId: user.id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      commitStore((prev) => ({
        ...prev,
        recurring: [...prev.recurring, created],
      }));
      pushToast({ type: 'success', title: 'Dodano płatność cykliczną' });
    }
  };

  const handleToggleRecurring = (id: string) => {
    const now = new Date().toISOString();
    commitStore((prev) => ({
      ...prev,
      recurring: prev.recurring.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive, updatedAt: now } : r
      ),
    }));
  };

  const handleRecordRecurringNow = (item: RecurringTransaction) => {
    const now = new Date().toISOString();
    const tx: Transaction = {
      id: makeId('tx'),
      userId: user.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: toIsoDate(new Date()),
      paymentMethod: 'Przelew bankowy',
      description: 'Zaksięgowana płatność cykliczna',
      createdAt: now,
      updatedAt: now,
    };
    const nextDate = computeNextPaymentDate(item.nextPaymentDate, item.frequency);
    commitStore((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
      recurring: prev.recurring.map((r) =>
        r.id === item.id ? { ...r, nextPaymentDate: nextDate, updatedAt: now } : r
      ),
    }));
    pushToast({
      type: 'success',
      title: `Zaksięgowano: ${item.name}`,
      description: `Kolejny termin przesunięto na ${nextDate}.`,
    });
  };

  const handleDeleteRecurring = (id: string) => {
    commitStore((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((r) => r.id !== id),
    }));
    pushToast({ type: 'info', title: 'Płatność cykliczna usunięta' });
  };

  const handleUpdateChat = (messages: ChatMessage[]) => {
    commitStore((prev) => ({ ...prev, chatHistory: messages }), false);
  };

  const handleMarkNotificationRead = (id: string) => {
    commitStore(
      (prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      }),
      false
    );
  };

  const handleMarkAllNotificationsRead = () => {
    commitStore(
      (prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      }),
      false
    );
  };

  const handleDeleteNotification = (id: string) => {
    commitStore(
      (prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id),
      }),
      false
    );
  };

  const handleAddAiNotifications = (
    items: Array<{ title: string; message: string; severity: 'info' | 'warning' | 'success' }>
  ) => {
    const now = new Date().toISOString();
    const created: AppNotification[] = items.map((item) => ({
      id: makeId('notif-ai'),
      userId: user.id,
      title: item.title,
      message: item.message,
      kind: 'ai',
      severity: item.severity === 'warning' || item.severity === 'success' ? item.severity : 'info',
      read: false,
      createdAt: now,
    }));
    commitStore(
      (prev) => ({
        ...prev,
        notifications: [...created, ...prev.notifications].slice(0, 60),
      }),
      false
    );
    pushToast({
      type: 'success',
      title: `Dodano ${created.length} obserwacje MoneyMind AI`,
    });
  };

  const handleLoadDemoData = () => {
    const demoStore = createStoreWithDemoData(user.id, store.settings);
    commitStore((prev) => ({
      ...prev,
      transactions: [...prev.transactions.filter((t) => !t.isDemo), ...demoStore.transactions],
      budgets: [...prev.budgets.filter((b) => !b.isDemo), ...demoStore.budgets],
      goals: [...prev.goals.filter((g) => !g.isDemo), ...demoStore.goals],
      recurring: [...prev.recurring.filter((r) => !r.isDemo), ...demoStore.recurring],
    }));
    pushToast({
      type: 'success',
      title: 'Załadowano przykładowe dane demo',
    });
  };

  const handleClearDemoData = () => {
    commitStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !t.isDemo),
      budgets: prev.budgets.filter((b) => !b.isDemo),
      goals: prev.goals.filter((g) => !g.isDemo),
      recurring: prev.recurring.filter((r) => !r.isDemo),
      notifications: [],
    }));
    pushToast({
      type: 'info',
      title: 'Usunięto dane demonstracyjne',
    });
  };

  const handleClearAllFinancialData = () => {
    commitStore(
      () => ({
        settings: createDefaultSettings(user.id),
        transactions: [],
        budgets: [],
        goals: [],
        recurring: [],
        notifications: [],
        chatHistory: [],
      }),
      false
    );
    pushToast({
      type: 'info',
      title: 'Wyczyszczono wszystkie dane finansowe',
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({ user: { name: user.name, email: user.email }, ...store }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymind-backup-${toIsoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: 'success', title: 'Wyeksportowano kopię JSON' });
  };

  const handleExportCsv = () => {
    const csv = transactionsToCsv(store.transactions, store.settings.currency);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymind-transakcje-${toIsoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ type: 'success', title: 'Wyeksportowano plik CSV' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14] text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        unreadNotifications={unreadNotifications}
        onLogout={handleLogout}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          user={user}
          unreadCount={unreadNotifications}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onQuickAddTransaction={() => {
            setEditingTx(null);
            setTxModalOpen(true);
          }}
          onNavigate={setActiveTab}
        />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={store.transactions}
              budgets={store.budgets}
              currency={store.settings.currency}
              hasDemoData={hasDemoData}
              onLoadDemoData={handleLoadDemoData}
              onClearDemoData={handleClearDemoData}
              onAddTransaction={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={store.transactions}
              currency={store.settings.currency}
              onAdd={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onEdit={(tx) => {
                setEditingTx(tx);
                setTxModalOpen(true);
              }}
              onDelete={handleDeleteTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={store.budgets}
              transactions={store.transactions}
              currency={store.settings.currency}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              goals={store.goals}
              currency={store.settings.currency}
              onSaveGoal={handleSaveGoal}
              onContributeGoal={handleContributeGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              transactions={store.transactions}
              currency={store.settings.currency}
              onExportSuccess={() =>
                pushToast({ type: 'success', title: 'Raport CSV został pobrany' })
              }
            />
          )}

          {activeTab === 'recurring' && (
            <RecurringView
              items={store.recurring}
              currency={store.settings.currency}
              onSaveRecurring={handleSaveRecurring}
              onToggleActive={handleToggleRecurring}
              onRecordPaymentNow={handleRecordRecurringNow}
              onDeleteRecurring={handleDeleteRecurring}
            />
          )}

          {activeTab === 'ai' && (
            <AiAssistantView
              userName={user.name}
              currency={store.settings.currency}
              transactions={store.transactions}
              budgets={store.budgets}
              goals={store.goals}
              recurring={store.recurring}
              chatHistory={store.chatHistory}
              onUpdateChatHistory={handleUpdateChat}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              userName={user.name}
              currency={store.settings.currency}
              notifications={store.notifications}
              transactions={store.transactions}
              budgets={store.budgets}
              goals={store.goals}
              recurring={store.recurring}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onDeleteNotification={handleDeleteNotification}
              onAddAiNotifications={handleAddAiNotifications}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              settings={store.settings}
              hasDemoData={hasDemoData}
              onUpdateProfile={(patch) => {
                const updated = updateUserProfile(user.id, patch);
                if (updated) setUser(updated);
                pushToast({ type: 'success', title: 'Zaktualizowano profil użytkownika' });
              }}
              onUpdateSettings={(patch: Partial<UserSettings>) => {
                commitStore((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    ...patch,
                    updatedAt: new Date().toISOString(),
                  },
                }));
                pushToast({ type: 'success', title: 'Zapisano ustawienia' });
              }}
              onChangePassword={(cur, next) => changeUserPassword(user.id, cur, next)}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
              onLoadDemoData={handleLoadDemoData}
              onClearDemoData={handleClearDemoData}
              onClearAllFinancialData={handleClearAllFinancialData}
              onDeleteAccount={() => {
                deleteUserAccount(user.id);
                setUser(null);
                setStore(null);
                pushToast({ type: 'info', title: 'Konto zostało usunięte' });
              }}
            />
          )}
        </main>
      </div>

      <TransactionModal
        open={txModalOpen}
        editingTransaction={editingTx}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}
