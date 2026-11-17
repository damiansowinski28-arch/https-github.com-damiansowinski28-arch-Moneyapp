import { useState, type FormEvent } from 'react';
import {
  Download,
  KeyRound,
  Moon,
  Sparkles,
  Sun,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type {
  CurrencyCode,
  LanguageCode,
  ThemeMode,
  UserProfile,
  UserSettings,
} from '../types/finance';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsViewProps {
  user: UserProfile;
  settings: UserSettings;
  hasDemoData: boolean;
  onUpdateProfile: (patch: { name: string; email: string }) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onChangePassword: (currentPassword: string, newPassword: string) => { ok?: boolean; error?: string };
  onExportJson: () => void;
  onExportCsv: () => void;
  onLoadDemoData: () => void;
  onClearDemoData: () => void;
  onClearAllFinancialData: () => void;
  onDeleteAccount: () => void;
}

export function SettingsView({
  user,
  settings,
  hasDemoData,
  onUpdateProfile,
  onUpdateSettings,
  onChangePassword,
  onExportJson,
  onExportCsv,
  onLoadDemoData,
  onClearDemoData,
  onClearAllFinancialData,
  onDeleteAccount,
}: SettingsViewProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    onUpdateProfile({ name: name.trim(), email: email.trim() });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    const res = onChangePassword(currentPw, newPw);
    if (res.error) {
      setPwError(res.error);
      return;
    }
    setCurrentPw('');
    setNewPw('');
    setPwSuccess('Hasło zostało zaktualizowane.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Ustawienia i profil
        </h2>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Personalizuj dane konta, walutę, motyw, powiadomienia i zarządzanie danymi
        </p>
      </div>

      {/* Personal Profile */}
      <form
        onSubmit={handleProfileSave}
        className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/6">
          <UserCheck className="h-4.5 w-4.5 text-emerald-500" />
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Dane osobowe
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Imię i nazwisko
            </label>
            <input
              id="settings-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="settings-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Adres e-mail
            </label>
            <input
              id="settings-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Zapisz profil
          </button>
        </div>
      </form>

      {/* Preferences: Currency, Theme, Language */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 space-y-5">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/6">
          Preferencje aplikacji
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="settings-currency"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Domyślna waluta
            </label>
            <select
              id="settings-currency"
              value={settings.currency}
              onChange={(e) =>
                onUpdateSettings({ currency: e.target.value as CurrencyCode })
              }
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="PLN">PLN — Polski złoty (zł)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="USD">USD — Dolar amerykański ($)</option>
              <option value="GBP">GBP — Funt brytyjski (£)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="settings-language"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Język interfejsu
            </label>
            <select
              id="settings-language"
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({ language: e.target.value as LanguageCode })
              }
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="pl">Polski (domyślny)</option>
              <option value="en">Polski (format międzynarodowy)</option>
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Motyw kolorystyczny
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' as ThemeMode })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-[#1C2530] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Ciemny
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' as ThemeMode })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-[#1C2530] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Jasny
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/6">
          Preferencje powiadomień
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            {
              key: 'notificationsEnabled' as const,
              label: 'Powiadomienia w aplikacji',
              desc: 'Główny przełącznik centrum powiadomień',
            },
            {
              key: 'budgetAlertsEnabled' as const,
              label: 'Ostrzeżenia budżetowe',
              desc: 'Alerty przy 50%, 75%, 90% oraz przekroczeniu limitu',
            },
            {
              key: 'recurringRemindersEnabled' as const,
              label: 'Przypomnienia o płatnościach',
              desc: 'Alerty o nadchodzących subskrypcjach w ciągu 7 dni',
            },
            {
              key: 'goalMilestonesEnabled' as const,
              label: 'Kamienie milowe celów',
              desc: 'Powiadomienia przy 50%, 75% i 100% celu',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/8 p-3.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={(e) => onUpdateSettings({ [item.key]: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Account Security */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 space-y-4"
      >
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/6">
          <KeyRound className="h-4.5 w-4.5 text-blue-500" />
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Bezpieczeństwo konta
          </h3>
        </div>

        {pwError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-500">
            {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-500">
            {pwSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sec-current-pw"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Obecne hasło
            </label>
            <input
              id="sec-current-pw"
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="sec-new-pw"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Nowe hasło (min. 6 znaków)
            </label>
            <input
              id="sec-new-pw"
              type="password"
              required
              minLength={6}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
          >
            Zmień hasło
          </button>
        </div>
      </form>

      {/* Data Export, Demo Data & Deletion */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 p-6 space-y-5">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/6">
          Dane, tryb demo i eksport
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            Eksportuj kopię zapasową (JSON)
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <Download className="h-4 w-4 text-blue-500" />
            Eksportuj transakcje (CSV)
          </button>

          {hasDemoData ? (
            <button
              type="button"
              onClick={onClearDemoData}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-300 hover:bg-amber-500/15"
            >
              <Trash2 className="h-4 w-4" />
              Usuń tylko dane demo
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadDemoData}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
            >
              <Sparkles className="h-4 w-4" />
              Załaduj przykładowe dane demo
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trwałe usunięcie wszystkich rekordów finansowych lub zamknięcie konta.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmResetAll(true)}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 px-3.5 py-2 text-xs font-semibold text-rose-500 transition-colors"
            >
              Wyczyść wszystkie dane finansowe
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteAccount(true)}
              className="rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              Usuń konto
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResetAll}
        title="Wyczyścić wszystkie dane finansowe?"
        description="Usunie to bezpowrotnie wszystkie Twoje transakcje, budżety, cele oszczędnościowe, płatności cykliczne oraz historię czatu AI."
        confirmLabel="Tak, wyczyść dane"
        onCancel={() => setConfirmResetAll(false)}
        onConfirm={() => {
          onClearAllFinancialData();
          setConfirmResetAll(false);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteAccount}
        title="Usunąć konto MoneyMind?"
        description="Twoje konto oraz wszystkie zapisane dane finansowe zostaną trwale usunięte z pamięci lokalnej przeglądarki."
        confirmLabel="Tak, usuń konto"
        onCancel={() => setConfirmDeleteAccount(false)}
        onConfirm={() => {
          onDeleteAccount();
          setConfirmDeleteAccount(false);
        }}
      />
    </div>
  );
}
