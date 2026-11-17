import type {
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { getMonthKey, shiftMonthKey, toIsoDate } from './finance';

export interface DemoBundle {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
}

function makeDateInMonth(monthKey: string, day: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const maxDay = new Date(y, m, 0).getDate();
  const clamped = Math.min(Math.max(1, day), maxDay);
  return `${monthKey}-${String(clamped).padStart(2, '0')}`;
}

export function createDemoBundle(
  userId: string,
  referenceDate: Date = new Date()
): DemoBundle {
  const nowIso = referenceDate.toISOString();
  const m0 = getMonthKey(referenceDate); // current month
  const m1 = shiftMonthKey(m0, -1); // -1 month
  const m2 = shiftMonthKey(m0, -2); // -2 months
  const m3 = shiftMonthKey(m0, -3); // -3 months
  const m4 = shiftMonthKey(m0, -4); // -4 months
  const m5 = shiftMonthKey(m0, -5); // -5 months
  const todayDay = referenceDate.getDate();

  const rawTx: Array<Omit<Transaction, 'id' | 'userId' | 'isDemo' | 'createdAt' | 'updatedAt'>> = [
    // Month -5
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9100, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m5, 10), paymentMethod: 'Przelew bankowy', description: 'Pensja zasadnicza' },
    { name: 'Czynsz i media', amount: 3100, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m5, 5), paymentMethod: 'Przelew bankowy', description: 'Czynsz za mieszkanie' },
    { name: 'Zakupy spożywcze — Biedronka', amount: 1420, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m5, 16), paymentMethod: 'Karta debetowa', description: 'Zakupy miesięczne' },
    { name: 'Paliwo i dojazdy', amount: 440, type: 'expense', category: 'Transport', date: makeDateInMonth(m5, 21), paymentMethod: 'BLIK', description: 'Tankowanie i bilety' },
    { name: 'Subskrypcje cyfrowe', amount: 165, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m5, 24), paymentMethod: 'Karta kredytowa', description: 'Netflix, Spotify' },

    // Month -4
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9100, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m4, 10), paymentMethod: 'Przelew bankowy', description: 'Pensja zasadnicza' },
    { name: 'Konsultacje produktowe', amount: 1300, type: 'income', category: 'Freelance', date: makeDateInMonth(m4, 18), paymentMethod: 'Przelew bankowy', description: 'Warsztat UX' },
    { name: 'Czynsz i media', amount: 3120, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m4, 5), paymentMethod: 'Przelew bankowy', description: 'Czynsz + internet' },
    { name: 'Zakupy spożywcze — Lidl', amount: 1510, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m4, 14), paymentMethod: 'Karta debetowa', description: 'Zakupy domowe' },
    { name: 'Wyjazd nad morze', amount: 980, type: 'expense', category: 'Podróże', date: makeDateInMonth(m4, 20), paymentMethod: 'Karta kredytowa', description: 'Weekendowy odpoczynek' },
    { name: 'Subskrypcje cyfrowe', amount: 165, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m4, 24), paymentMethod: 'Karta kredytowa', description: 'Netflix, Spotify' },

    // Month -3
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9400, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m3, 10), paymentMethod: 'Przelew bankowy', description: 'Pensja zasadnicza' },
    { name: 'Czynsz i media', amount: 3150, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m3, 5), paymentMethod: 'Przelew bankowy', description: 'Czynsz za mieszkanie + prąd' },
    { name: 'Zakupy spożywcze — Lidl', amount: 1480, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m3, 14), paymentMethod: 'Karta debetowa', description: 'Zakupy tygodniowe' },
    { name: 'Paliwo i bilet miejski', amount: 460, type: 'expense', category: 'Transport', date: makeDateInMonth(m3, 18), paymentMethod: 'BLIK', description: 'Orlen + Karta Miejska' },
    { name: 'Kino i kolacja', amount: 390, type: 'expense', category: 'Rozrywka', date: makeDateInMonth(m3, 22), paymentMethod: 'Karta debetowa', description: 'Wyjście weekendowe' },
    { name: 'Subskrypcje cyfrowe', amount: 185, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m3, 24), paymentMethod: 'Karta kredytowa', description: 'Netflix, Spotify, iCloud' },

    // Month -2
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9400, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m2, 10), paymentMethod: 'Przelew bankowy', description: 'Pensja zasadnicza' },
    { name: 'Projekt UX dla klienta', amount: 2200, type: 'income', category: 'Freelance', date: makeDateInMonth(m2, 19), paymentMethod: 'Przelew bankowy', description: 'Konsultacje produktowe' },
    { name: 'Czynsz i media', amount: 3180, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m2, 5), paymentMethod: 'Przelew bankowy', description: 'Czynsz + internet światłowodowy' },
    { name: 'Zakupy spożywcze — Biedronka', amount: 1590, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m2, 15), paymentMethod: 'Karta debetowa', description: 'Zakupy domowe' },
    { name: 'Weekend w Zakopanem', amount: 1250, type: 'expense', category: 'Podróże', date: makeDateInMonth(m2, 21), paymentMethod: 'Karta kredytowa', description: 'Nocleg i kolejka' },
    { name: 'Kurs TypeScript & AI', amount: 420, type: 'expense', category: 'Edukacja', date: makeDateInMonth(m2, 25), paymentMethod: 'BLIK', description: 'Szkolenie online' },
    { name: 'Subskrypcje cyfrowe', amount: 185, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m2, 26), paymentMethod: 'Karta kredytowa', description: 'Netflix, Spotify, iCloud' },

    // Month -1
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9800, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m1, 10), paymentMethod: 'Przelew bankowy', description: 'Pensja po podwyżce' },
    { name: 'Dywidenda ETF', amount: 540, type: 'income', category: 'Inwestycje', date: makeDateInMonth(m1, 22), paymentMethod: 'Przelew bankowy', description: 'Kwartalna wypłata z portfela' },
    { name: 'Czynsz i media', amount: 3200, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m1, 5), paymentMethod: 'Przelew bankowy', description: 'Czynsz administracyjny i media' },
    { name: 'Zakupy spożywcze i piekarnia', amount: 1640, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m1, 12), paymentMethod: 'Karta debetowa', description: 'Lidl + lokalna piekarnia' },
    { name: 'Paliwo Orlen & Uber', amount: 510, type: 'expense', category: 'Transport', date: makeDateInMonth(m1, 14), paymentMethod: 'BLIK', description: 'Dojazdy miejskie' },
    { name: 'Odzież jesienna — Zalando', amount: 780, type: 'expense', category: 'Zakupy', date: makeDateInMonth(m1, 17), paymentMethod: 'BLIK', description: 'Kurtka i buty' },
    { name: 'Stomatolog i apteka', amount: 480, type: 'expense', category: 'Zdrowie', date: makeDateInMonth(m1, 20), paymentMethod: 'Karta debetowa', description: 'Wizyta kontrolna' },
    { name: 'Subskrypcje cyfrowe', amount: 229, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m1, 24), paymentMethod: 'Karta kredytowa', description: 'Netflix, Spotify, ChatGPT Plus' },
    { name: 'Restauracja i koncert', amount: 460, type: 'expense', category: 'Rozrywka', date: makeDateInMonth(m1, 27), paymentMethod: 'Apple Pay / Google Pay', description: 'Sobota ze znajomymi' },

    // Current Month (m0) — dates capped at todayDay so everything feels realistic
    { name: 'Wynagrodzenie — TechFlow Sp. z o.o.', amount: 9800, type: 'income', category: 'Wynagrodzenie', date: makeDateInMonth(m0, Math.min(todayDay, 10)), paymentMethod: 'Przelew bankowy', description: 'Wynagrodzenie miesięczne' },
    { name: 'Audyt aplikacji webowej', amount: 1650, type: 'income', category: 'Freelance', date: makeDateInMonth(m0, Math.max(1, Math.min(todayDay, 12))), paymentMethod: 'Przelew bankowy', description: 'Zlecenie dodatkowe' },
    { name: 'Czynsz za mieszkanie', amount: 3200, type: 'expense', category: 'Mieszkanie', date: makeDateInMonth(m0, Math.min(todayDay, 4)), paymentMethod: 'Przelew bankowy', description: 'Czynsz + opłaty wspólnoty' },
    { name: 'Zakupy spożywcze — Lidl', amount: 645, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m0, Math.max(1, todayDay - 8)), paymentMethod: 'Karta debetowa', description: 'Cotygodniowe zakupy' },
    { name: 'Biedronka & warzywniak', amount: 520, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m0, Math.max(1, todayDay - 3)), paymentMethod: 'BLIK', description: 'Świeże produkty i nabiał' },
    { name: 'Lunch w mieście i kawa', amount: 275, type: 'expense', category: 'Jedzenie', date: makeDateInMonth(m0, Math.max(1, todayDay - 1)), paymentMethod: 'Apple Pay / Google Pay', description: 'Spotkania robocze' },
    { name: 'Tankowanie Shell', amount: 340, type: 'expense', category: 'Transport', date: makeDateInMonth(m0, Math.max(1, todayDay - 6)), paymentMethod: 'Karta debetowa', description: 'Pełny bak' },
    { name: 'Bilet kolejowy PKP', amount: 145, type: 'expense', category: 'Transport', date: makeDateInMonth(m0, Math.max(1, todayDay - 2)), paymentMethod: 'BLIK', description: 'Wyjazd służbowy' },
    { name: 'Elektronika — akcesoria biurkowe', amount: 890, type: 'expense', category: 'Zakupy', date: makeDateInMonth(m0, Math.max(1, todayDay - 5)), paymentMethod: 'Karta kredytowa', description: 'Stacja dokująca USB-C' },
    { name: 'Netflix Premium & Spotify', amount: 94, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m0, Math.max(1, todayDay - 4)), paymentMethod: 'Karta kredytowa', description: 'Rozrywka i muzyka' },
    { name: 'ChatGPT & narzędzia chmurowe', amount: 135, type: 'expense', category: 'Subskrypcje', date: makeDateInMonth(m0, Math.max(1, todayDay - 2)), paymentMethod: 'Karta kredytowa', description: 'Narzędzia AI i hosting' },
    { name: 'Siłownia i fizjoterapia', amount: 320, type: 'expense', category: 'Zdrowie', date: makeDateInMonth(m0, Math.max(1, todayDay - 7)), paymentMethod: 'BLIK', description: 'Karnet i wizyta' },
    { name: 'Kino IMAX i kolacja', amount: 265, type: 'expense', category: 'Rozrywka', date: toIsoDate(referenceDate), paymentMethod: 'Apple Pay / Google Pay', description: 'Premiera filmowa' },
  ];

  const transactions: Transaction[] = rawTx.map((item, idx) => ({
    ...item,
    id: `demo-tx-${idx + 1}`,
    userId,
    isDemo: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  }));

  const budgets: Budget[] = [
    { id: 'demo-b-1', userId, category: 'Jedzenie', limit: 1600, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 'demo-b-2', userId, category: 'Mieszkanie', limit: 3400, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 'demo-b-3', userId, category: 'Transport', limit: 600, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 'demo-b-4', userId, category: 'Zakupy', limit: 800, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 'demo-b-5', userId, category: 'Subskrypcje', limit: 250, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 'demo-b-6', userId, category: 'Rozrywka', limit: 500, month: m0, isDemo: true, createdAt: nowIso, updatedAt: nowIso },
  ];

  const nextYearDate = new Date(referenceDate);
  nextYearDate.setMonth(nextYearDate.getMonth() + 8);
  const sixMonthsDate = new Date(referenceDate);
  sixMonthsDate.setMonth(sixMonthsDate.getMonth() + 5);
  const yearPlusDate = new Date(referenceDate);
  yearPlusDate.setMonth(yearPlusDate.getMonth() + 14);

  const goals: SavingsGoal[] = [
    {
      id: 'demo-g-1',
      userId,
      name: 'Fundusz awaryjny',
      targetAmount: 30000,
      currentAmount: 22800,
      targetDate: toIsoDate(sixMonthsDate),
      description: 'Poduszka bezpieczeństwa na 6 miesięcy kosztów życia',
      icon: 'shield',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-g-2',
      userId,
      name: 'Wakacje w Japonii',
      targetAmount: 18000,
      currentAmount: 9400,
      targetDate: toIsoDate(nextYearDate),
      description: 'Bilety lotnicze, noclegi w Tokio i Kioto oraz JR Pass',
      icon: 'plane',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-g-3',
      userId,
      name: 'Nowy MacBook Pro',
      targetAmount: 11500,
      currentAmount: 6100,
      targetDate: toIsoDate(yearPlusDate),
      description: 'Stacja robocza do projektów i programowania',
      icon: 'laptop',
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const plus2 = new Date(referenceDate);
  plus2.setDate(plus2.getDate() + 2);
  const plus5 = new Date(referenceDate);
  plus5.setDate(plus5.getDate() + 5);
  const plus12 = new Date(referenceDate);
  plus12.setDate(plus12.getDate() + 12);
  const plus25 = new Date(referenceDate);
  plus25.setDate(plus25.getDate() + 25);
  const plus45 = new Date(referenceDate);
  plus45.setDate(plus45.getDate() + 45);

  const recurring: RecurringTransaction[] = [
    {
      id: 'demo-r-1',
      userId,
      name: 'Netflix Premium 4K',
      amount: 67,
      frequency: 'monthly',
      nextPaymentDate: toIsoDate(plus2),
      category: 'Subskrypcje',
      type: 'expense',
      isActive: true,
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-r-2',
      userId,
      name: 'Spotify Duo',
      amount: 31,
      frequency: 'monthly',
      nextPaymentDate: toIsoDate(plus5),
      category: 'Subskrypcje',
      type: 'expense',
      isActive: true,
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-r-3',
      userId,
      name: 'Czynsz i media',
      amount: 3200,
      frequency: 'monthly',
      nextPaymentDate: toIsoDate(plus12),
      category: 'Mieszkanie',
      type: 'expense',
      isActive: true,
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-r-4',
      userId,
      name: 'Kwartalny pakiet zdrowotny',
      amount: 420,
      frequency: 'quarterly',
      nextPaymentDate: toIsoDate(plus25),
      category: 'Zdrowie',
      type: 'expense',
      isActive: true,
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'demo-r-5',
      userId,
      name: 'Domena i serwer chmurowy',
      amount: 490,
      frequency: 'annually',
      nextPaymentDate: toIsoDate(plus45),
      category: 'Subskrypcje',
      type: 'expense',
      isActive: true,
      isDemo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  return { transactions, budgets, goals, recurring };
}
