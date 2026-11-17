import type {
  AppNotification,
  Budget,
  ChatMessage,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserProfile,
  UserSettings,
} from '../types/finance';
import { createDemoBundle } from '../utils/demoData';
import { generateIntelligentNotifications } from '../utils/finance';

export const DEFAULT_AVATAR_URL =
  '/src/assets/images/avatar_user_profile_1794855880385.jpg';

const USERS_KEY = 'moneymind_users_v1';
const SESSION_KEY = 'moneymind_session_user_id_v1';
const RESET_TOKENS_KEY = 'moneymind_reset_tokens_v1';

export interface UserFinancialStore {
  settings: UserSettings;
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringTransaction[];
  notifications: AppNotification[];
  chatHistory: ChatMessage[];
}

function userStoreKey(userId: string): string {
  return `moneymind_data_${userId}_v1`;
}

export function hashPasswordLocal(raw: string): string {
  // Deterministic non-reversible local digest for client-side dev auth
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `mm_${(h2 >>> 0).toString(16)}_${(h1 >>> 0).toString(16)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to persist to localStorage:', err);
  }
}

export function getAllUsers(): UserProfile[] {
  return readJson<UserProfile[]>(USERS_KEY, []);
}

function saveAllUsers(users: UserProfile[]): void {
  writeJson(USERS_KEY, users);
}

export function getCurrentSessionUser(): UserProfile | null {
  const userId = window.localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  const users = getAllUsers();
  return users.find((u) => u.id === userId) ?? null;
}

export function setCurrentSessionUserId(userId: string | null): void {
  if (userId) {
    window.localStorage.setItem(SESSION_KEY, userId);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function createDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    currency: 'PLN',
    language: 'pl',
    theme: 'dark',
    notificationsEnabled: true,
    budgetAlertsEnabled: true,
    recurringRemindersEnabled: true,
    goalMilestonesEnabled: true,
    aiInsightsEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export function registerLocalUser(input: {
  name: string;
  email: string;
  password: string;
  loadDemo: boolean;
}): { user?: UserProfile; error?: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) {
    return { error: 'Imię i nazwisko musi mieć co najmniej 2 znaki.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Podaj poprawny adres e-mail.' };
  }
  if (input.password.length < 6) {
    return { error: 'Hasło musi mieć co najmniej 6 znaków.' };
  }

  const users = getAllUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { error: 'Konto z tym adresem e-mail już istnieje.' };
  }

  const now = new Date().toISOString();
  const newUser: UserProfile = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    email,
    avatarUrl: DEFAULT_AVATAR_URL,
    passwordHash: hashPasswordLocal(input.password),
    createdAt: now,
    updatedAt: now,
  };

  saveAllUsers([...users, newUser]);

  const settings = createDefaultSettings(newUser.id);
  const store: UserFinancialStore = input.loadDemo
    ? createStoreWithDemoData(newUser.id, settings)
    : {
        settings,
        transactions: [],
        budgets: [],
        goals: [],
        recurring: [],
        notifications: [],
        chatHistory: [],
      };

  saveUserStore(newUser.id, store);
  setCurrentSessionUserId(newUser.id);
  return { user: newUser };
}

export function loginLocalUser(input: {
  email: string;
  password: string;
}): { user?: UserProfile; error?: string } {
  const email = input.email.trim().toLowerCase();
  const users = getAllUsers();
  const found = users.find((u) => u.email.toLowerCase() === email);
  if (!found) {
    return { error: 'Nie znaleziono konta o podanym adresie e-mail.' };
  }
  if (found.passwordHash !== hashPasswordLocal(input.password)) {
    return { error: 'Nieprawidłowe hasło. Spróbuj ponownie.' };
  }
  setCurrentSessionUserId(found.id);
  return { user: found };
}

export function ensureAndLoginDemoUser(): UserProfile {
  const demoEmail = 'anna.kowalska@moneymind.pl';
  const users = getAllUsers();
  let demoUser = users.find((u) => u.email === demoEmail);
  const now = new Date().toISOString();

  if (!demoUser) {
    demoUser = {
      id: 'usr_demo_anna',
      name: 'Anna Kowalska',
      email: demoEmail,
      avatarUrl: DEFAULT_AVATAR_URL,
      passwordHash: hashPasswordLocal('DemoMoneyMind123!'),
      isDemoAccount: true,
      createdAt: now,
      updatedAt: now,
    };
    saveAllUsers([...users, demoUser]);
    const settings = createDefaultSettings(demoUser.id);
    const store = createStoreWithDemoData(demoUser.id, settings);
    saveUserStore(demoUser.id, store);
  }

  setCurrentSessionUserId(demoUser.id);
  return demoUser;
}

export function requestLocalPasswordReset(email: string): {
  code?: string;
  error?: string;
} {
  const normalized = email.trim().toLowerCase();
  const users = getAllUsers();
  const found = users.find((u) => u.email.toLowerCase() === normalized);
  if (!found) {
    return { error: 'Nie znaleziono konta powiązanego z tym adresem e-mail.' };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const tokens = readJson<Record<string, { code: string; expiresAt: number }>>(
    RESET_TOKENS_KEY,
    {}
  );
  tokens[normalized] = {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  writeJson(RESET_TOKENS_KEY, tokens);
  return { code };
}

export function completeLocalPasswordReset(input: {
  email: string;
  code: string;
  newPassword: string;
}): { ok?: boolean; error?: string } {
  const normalized = input.email.trim().toLowerCase();
  if (input.newPassword.length < 6) {
    return { error: 'Nowe hasło musi mieć co najmniej 6 znaków.' };
  }
  const tokens = readJson<Record<string, { code: string; expiresAt: number }>>(
    RESET_TOKENS_KEY,
    {}
  );
  const token = tokens[normalized];
  if (!token || token.code !== input.code.trim() || Date.now() > token.expiresAt) {
    return { error: 'Nieprawidłowy lub wygasły kod weryfikacyjny.' };
  }
  const users = getAllUsers();
  const updated = users.map((u) =>
    u.email.toLowerCase() === normalized
      ? {
          ...u,
          passwordHash: hashPasswordLocal(input.newPassword),
          updatedAt: new Date().toISOString(),
        }
      : u
  );
  saveAllUsers(updated);
  delete tokens[normalized];
  writeJson(RESET_TOKENS_KEY, tokens);
  return { ok: true };
}

export function updateUserProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl'>>
): UserProfile | null {
  const users = getAllUsers();
  let updatedUser: UserProfile | null = null;
  const next = users.map((u) => {
    if (u.id !== userId) return u;
    updatedUser = {
      ...u,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return updatedUser;
  });
  saveAllUsers(next);
  return updatedUser;
}

export function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { ok?: boolean; error?: string } {
  if (newPassword.length < 6) {
    return { error: 'Nowe hasło musi mieć co najmniej 6 znaków.' };
  }
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { error: 'Nie znaleziono użytkownika.' };
  if (user.passwordHash !== hashPasswordLocal(currentPassword)) {
    return { error: 'Obecne hasło jest nieprawidłowe.' };
  }
  const updated = users.map((u) =>
    u.id === userId
      ? {
          ...u,
          passwordHash: hashPasswordLocal(newPassword),
          updatedAt: new Date().toISOString(),
        }
      : u
  );
  saveAllUsers(updated);
  return { ok: true };
}

export function deleteUserAccount(userId: string): void {
  const users = getAllUsers().filter((u) => u.id !== userId);
  saveAllUsers(users);
  window.localStorage.removeItem(userStoreKey(userId));
  setCurrentSessionUserId(null);
}

export function createStoreWithDemoData(
  userId: string,
  settings: UserSettings
): UserFinancialStore {
  const demo = createDemoBundle(userId);
  const notifications = generateIntelligentNotifications(
    userId,
    demo.transactions,
    demo.budgets,
    demo.goals,
    demo.recurring,
    settings,
    []
  );
  return {
    settings,
    transactions: demo.transactions,
    budgets: demo.budgets,
    goals: demo.goals,
    recurring: demo.recurring,
    notifications,
    chatHistory: [],
  };
}

export function loadUserStore(userId: string): UserFinancialStore {
  const fallbackSettings = createDefaultSettings(userId);
  const raw = readJson<Partial<UserFinancialStore> | null>(userStoreKey(userId), null);
  if (!raw) {
    const emptyStore: UserFinancialStore = {
      settings: fallbackSettings,
      transactions: [],
      budgets: [],
      goals: [],
      recurring: [],
      notifications: [],
      chatHistory: [],
    };
    saveUserStore(userId, emptyStore);
    return emptyStore;
  }

  return {
    settings: { ...fallbackSettings, ...(raw.settings || {}), userId },
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    budgets: Array.isArray(raw.budgets) ? raw.budgets : [],
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    recurring: Array.isArray(raw.recurring) ? raw.recurring : [],
    notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
    chatHistory: Array.isArray(raw.chatHistory) ? raw.chatHistory : [],
  };
}

export function saveUserStore(userId: string, store: UserFinancialStore): void {
  writeJson(userStoreKey(userId), store);
}
