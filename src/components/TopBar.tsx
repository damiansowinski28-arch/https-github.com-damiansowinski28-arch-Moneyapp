import { useState } from 'react';
import { Bell, Menu, Plus } from 'lucide-react';
import type { NavigationTab, UserProfile } from '../types/finance';
import { formatFullDatePL } from '../utils/finance';

interface TopBarProps {
  user: UserProfile;
  unreadCount: number;
  onOpenMobileNav: () => void;
  onQuickAddTransaction: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export function TopBar({
  user,
  unreadCount,
  onOpenMobileNav,
  onQuickAddTransaction,
  onNavigate,
}: TopBarProps) {
  const [imgError, setImgError] = useState(false);
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/8 bg-white/90 dark:bg-[#0B0F14]/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Otwórz menu nawigacji"
            className="lg:hidden rounded-xl p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-[15px] sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
              Dzień dobry, {firstName}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              {formatFullDatePL(new Date())}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={`Powiadomienia${unreadCount > 0 ? ` (${unreadCount} nieprzeczytanych)` : ''}`}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141B23] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-label="Otwórz profil i ustawienia"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-[#141B23] shrink-0"
          >
            {user.avatarUrl && !imgError ? (
              <img
                src={user.avatarUrl}
                alt={`Awatar użytkownika ${user.name}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {initials || 'MM'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onQuickAddTransaction}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Dodaj transakcję</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
        </div>
      </div>
    </header>
  );
}
