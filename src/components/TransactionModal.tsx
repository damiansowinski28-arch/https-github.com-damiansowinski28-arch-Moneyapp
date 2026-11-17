import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type Transaction,
  type TransactionType,
} from '../types/finance';
import { toIsoDate } from '../utils/finance';

interface TransactionModalProps {
  open: boolean;
  editingTransaction: Transaction | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    paymentMethod: string;
    description: string;
    notes?: string;
  }) => void;
}

export function TransactionModal({
  open,
  editingTransaction,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingTransaction) {
      setName(editingTransaction.name);
      setAmount(String(editingTransaction.amount));
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDescription(editingTransaction.description);
      setNotes(editingTransaction.notes || '');
    } else {
      setName('');
      setAmount('');
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(toIsoDate(new Date()));
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDescription('');
      setNotes('');
    }
  }, [open, editingTransaction]);

  if (!open) return null;

  const availableCategories =
    type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const list = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!(list as readonly string[]).includes(category)) {
      setCategory(list[0]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const numericAmount = Number(amount.replace(',', '.'));
    if (trimmedName.length < 2) {
      setError('Podaj nazwę transakcji (co najmniej 2 znaki).');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Kwota musi być liczbą większą od zera.');
      return;
    }
    if (!date) {
      setError('Wybierz datę transakcji.');
      return;
    }

    onSave({
      id: editingTransaction?.id,
      name: trimmedName,
      amount: Number(numericAmount.toFixed(2)),
      type,
      category,
      date,
      paymentMethod,
      description: description.trim(),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141B23] border border-slate-200 dark:border-white/10 p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/8">
          <h2
            id="tx-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-white"
          >
            {editingTransaction ? 'Edytuj transakcję' : 'Dodaj transakcję'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij formularz transakcji"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-500"
            >
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                type === 'expense'
                  ? 'bg-white dark:bg-[#1C2530] text-rose-500 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Wydatek
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                type === 'income'
                  ? 'bg-white dark:bg-[#1C2530] text-emerald-500 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Przychód
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="tx-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Nazwa transakcji
              </label>
              <input
                id="tx-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Np. Zakupy Lidl lub Wynagrodzenie"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kwota
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Data
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kategoria
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tx-method"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Metoda płatności
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="tx-description"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Opis
              </label>
              <input
                id="tx-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis transakcji"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="tx-notes"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Notatki (opcjonalnie)
              </label>
              <textarea
                id="tx-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dodatkowe szczegóły..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F14] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {editingTransaction ? 'Zapisz zmiany' : 'Dodaj transakcję'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
