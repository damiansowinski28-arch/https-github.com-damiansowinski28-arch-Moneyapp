import { useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bot,
  FileText,
  Lightbulb,
  LineChart,
  PieChart,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  Budget,
  ChatMessage,
  CurrencyCode,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { buildFinancialContextForAI } from '../utils/finance';
import { sendAiChatMessage } from '../services/aiClient';

interface AiAssistantViewProps {
  userName: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
  chatHistory: ChatMessage[];
  onUpdateChatHistory: (messages: ChatMessage[]) => void;
}

const SUGGESTED_QUESTIONS = [
  'Na co wydaję najwięcej pieniędzy?',
  'Jak mogę zaoszczędzić 500 zł miesięcznie?',
  'Ile wydałem w tym miesiącu na jedzenie?',
  'Jakie subskrypcje najbardziej obciążają mój budżet?',
  'Czy mój budżet jest dobrze zaplanowany?',
  'Jak mogę poprawić swoją sytuację finansową?',
];

const ANALYSIS_MODES = [
  {
    id: 'spending_analysis',
    label: 'Analiza wydatków',
    prompt: 'Przeanalizuj moje wydatki i wskaż największe kategorie kosztowe.',
    icon: PieChart,
  },
  {
    id: 'savings_recommendations',
    label: 'Rekomendacje oszczędności',
    prompt: 'Zaproponuj realistyczne sposoby na obniżenie zbędnych wydatków.',
    icon: Lightbulb,
  },
  {
    id: 'monthly_report',
    label: 'Raport miesięczny',
    prompt: 'Wygeneruj miesięczne podsumowanie przychodów, wydatków i oszczędności.',
    icon: FileText,
  },
  {
    id: 'pattern_detection',
    label: 'Wykrywanie wzorców',
    prompt: 'Wskaż nietypowe wzorce i wahania w moich wydatkach.',
    icon: ShieldAlert,
  },
  {
    id: 'budget_recommendations',
    label: 'Limity budżetowe',
    prompt: 'Zaproponuj rozsądne limity budżetowe na podstawie historii wydatków.',
    icon: Sparkles,
  },
  {
    id: 'financial_forecast',
    label: 'Prognoza finansowa',
    prompt: 'Oszacuj moje przewidywane wydatki w przyszłym miesiącu na bazie historii.',
    icon: LineChart,
  },
];

export function AiAssistantView({
  userName,
  currency,
  transactions,
  budgets,
  goals,
  recurring,
  chatHistory,
  onUpdateChatHistory,
}: AiAssistantViewProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sendPrompt = async (promptText: string, mode: string = 'chat') => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      mode,
    };

    const nextHistory = [...chatHistory, userMsg];
    onUpdateChatHistory(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const financialContext = buildFinancialContextForAI(
        userName,
        currency,
        transactions,
        budgets,
        goals,
        recurring
      );

      const reply = await sendAiChatMessage({
        messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        financialContext,
        analysisMode: mode,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        mode,
      };
      onUpdateChatHistory([...nextHistory, assistantMsg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się połączyć z asystentem MoneyMind AI.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendPrompt(input, 'chat');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            MoneyMind AI
          </h2>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Asystent finansowy analizujący wyłącznie Twoje rzeczywiste transakcje, budżety i cele
          </p>
        </div>

        {chatHistory.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onUpdateChatHistory([]);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141B23] px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Wyczyść rozmowę
          </button>
        )}
      </div>

      {/* Analysis Modes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {ANALYSIS_MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              disabled={loading}
              onClick={() => void sendPrompt(m.prompt, m.id)}
              className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#141B23] hover:border-emerald-500/40 p-3.5 text-left transition-colors disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chat Container */}
      <div className="rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/8 flex flex-col min-h-[460px] max-h-[640px]">
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Cześć, {userName.split(/\s+/)[0]}! W czym mogę pomóc?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Analizuję Twoje potwierdzone transakcje ({transactions.length}), budżety ({budgets.length}), cele oszczędnościowe ({goals.length}) oraz płatności cykliczne ({recurring.length}). Wybierz jedno z pytań poniżej lub wpisz własne.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendPrompt(q, 'chat')}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] hover:border-emerald-500/40 px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                MoneyMind AI analizuje Twoje dane finansowe...
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-500"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 dark:border-white/8 p-4 flex items-center gap-3"
        >
          <input
            type="text"
            aria-label="Zadaj pytanie asystentowi MoneyMind AI"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Zadaj pytanie o swoje wydatki, budżet lub plan oszczędzania..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Wyślij pytanie"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Wyślij</span>
          </button>
        </form>
      </div>

      {/* Informational Disclaimer */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Zastrzeżenie: Rekomendacje generowane przez MoneyMind AI mają charakter wyłącznie informacyjny i edukacyjny oraz nie stanowią profesjonalnej porady finansowej, podatkowej ani inwestycyjnej. Prognozy są szacunkami opartymi na danych historycznych.
      </p>
    </div>
  );
}
