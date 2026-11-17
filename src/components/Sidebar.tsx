import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PieChart,
  Repeat,
  Settings,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import type { NavigationTab } from '../types/finance';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  unreadNotifications: number;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{
  id: NavigationTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transakcje', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budżety', icon: PieChart },
  { id: 'goals', label: 'Cele oszczędnościowe', icon: Target },
  { id: 'analytics', label: 'Analityka', icon: BarChart3 },
  { id: 'recurring', label: 'Płatności cykliczne', icon: Repeat },
  { id: 'ai', label: 'MoneyMind AI', icon: Bot },
  { id: 'notifications', label: 'Powiadomienia', icon: Bell },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  unreadNotifications,
  onLogout,
}: SidebarProps) {
  const handlePick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const renderNavContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0E131A] border-r border-slate-200 dark:border-white/8">
      <div>
        {/* Brand Row */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-white/8">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Wallet className="h-5 w-5" />
            </div>
            {(!collapsed || isMobile) && (
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                MoneyMind
              </span>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Zamknij menu nawigacji"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Rozwiń panel boczny' : 'Zwiń panel boczny'}
              className="hidden lg:flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Główna nawigacja" className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const showBadge = item.id === 'notifications' && unreadNotifications > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePick(item.id)}
                title={collapsed && !isMobile ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                } ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  )}
                </span>
                {showBadge && (!collapsed || isMobile) && (
                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-white/8">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed && !isMobile ? 'Wyloguj się' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {(!collapsed || isMobile) && <span className="whitespace-nowrap">Wyloguj się</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderNavContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
