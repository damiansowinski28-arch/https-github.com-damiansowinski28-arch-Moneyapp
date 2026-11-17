import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  KeyRound,
  Lock,
  Mail,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import type { UserProfile } from '../types/finance';
import {
  completeLocalPasswordReset,
  ensureAndLoginDemoUser,
  loginLocalUser,
  registerLocalUser,
  requestLocalPasswordReset,
} from '../services/storage';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadDemoOnRegister, setLoadDemoOnRegister] = useState(true);

  // Password recovery state
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [generatedResetCode, setGeneratedResetCode] = useState<string | null>(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfoMessage(null);
    setResetStep('request');
    setGeneratedResetCode(null);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = loginLocalUser({ email, password });
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.user) {
      onAuthenticated(res.user);
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = registerLocalUser({
      name,
      email,
      password,
      loadDemo: loadDemoOnRegister,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.user) {
      onAuthenticated(res.user);
    }
  };

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (resetStep === 'request') {
      const res = requestLocalPasswordReset(email);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.code) {
        setGeneratedResetCode(res.code);
        setResetStep('confirm');
        setInfoMessage(
          'Wygenerowano 6-cyfrowy kod weryfikacyjny do resetu hasła w trybie lokalnym.'
        );
      }
      return;
    }

    const res = completeLocalPasswordReset({
      email,
      code: resetCodeInput,
      newPassword,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    setMode('login');
    setPassword('');
    setResetStep('request');
    setGeneratedResetCode(null);
    setInfoMessage('Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.');
  };

  const handleDemoLogin = () => {
    const demoUser = ensureAndLoginDemoUser();
    onAuthenticated(demoUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14] flex flex-col lg:flex-row">
      {/* Left Brand & Value Column */}
      <div className="lg:w-5/12 xl:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/8 bg-white dark:bg-[#0E131A]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              MoneyMind
            </span>
          </div>

          <div className="mt-12 lg:mt-20 max-w-lg">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
              Inteligentna kontrola nad Twoimi finansami osobistymi
            </h1>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Śledź przychody i wydatki, planuj miesięczne budżety, realizuj cele
              oszczędnościowe i korzystaj ze spersonalizowanych analiz asystenta MoneyMind AI.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#141B23] p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Budżety i prognozy
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatyczne ostrzeżenia przy 50%, 75%, 90% i przekroczeniu limitów.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#141B23] p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Asystent Gemini AI
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Analiza rzeczywistych transakcji, rekomendacje oszczędności i raporty.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-500 dark:text-slate-500">
          Tryb lokalnego zapisu danych w przeglądarce · Pełna izolacja kont użytkowników
        </p>
      </div>

      {/* Right Auth Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1C2530] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1C2530] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Rejestracja
            </button>
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'reset'
                  ? 'bg-white dark:bg-[#1C2530] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Odzyskaj hasło
            </button>
          </div>

          <h2 className="mt-6 font-display text-2xl font-bold text-slate-900 dark:text-white">
            {mode === 'login'
              ? 'Witaj ponownie'
              : mode === 'register'
                ? 'Utwórz konto MoneyMind'
                : 'Odzyskiwanie dostępu'}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Zaloguj się, aby zarządzać swoimi finansami.'
              : mode === 'register'
                ? 'Rozpocznij świadome zarządzanie budżetem.'
                : 'Podaj adres e-mail powiązany z Twoim kontem.'}
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              <p>{infoMessage}</p>
              {generatedResetCode && (
                <p className="mt-1 font-mono font-semibold text-emerald-800 dark:text-emerald-200">
                  Kod weryfikacyjny: {generatedResetCode}
                </p>
              )}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Adres e-mail
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan.kowalski@example.pl"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Hasło
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 znaków"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Zaloguj się
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Imię i nazwisko
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Np. Jan Nowak"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Adres e-mail
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@example.pl"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Hasło
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 znaków"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={loadDemoOnRegister}
                  onChange={(e) => setLoadDemoOnRegister(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Załaduj przykładowe dane demo na start (możesz je usunąć w dowolnym momencie)
                </span>
              </label>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Załóż konto
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Adres e-mail konta
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@example.pl"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {resetStep === 'confirm' && (
                <>
                  <div>
                    <label
                      htmlFor="reset-code"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Kod weryfikacyjny
                    </label>
                    <div className="relative">
                      <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reset-code"
                        type="text"
                        required
                        value={resetCodeInput}
                        onChange={(e) => setResetCodeInput(e.target.value)}
                        placeholder="6-cyfrowy kod"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="reset-new-pw"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Nowe hasło
                    </label>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reset-new-pw"
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 znaków"
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {resetStep === 'request' ? 'Wyślij kod weryfikacyjny' : 'Ustaw nowe hasło'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Wypróbuj konto demo (Anna Kowalska)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
