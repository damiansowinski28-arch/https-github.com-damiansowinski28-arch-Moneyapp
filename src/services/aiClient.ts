import type { ChatMessage } from '../types/finance';

export interface AiInsightItem {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

export async function sendAiChatMessage(params: {
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>;
  financialContext: Record<string, unknown>;
  analysisMode: string;
}): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof payload.error === 'string' && payload.error.trim()
        ? payload.error
        : 'Nie udało się połączyć z asystentem MoneyMind AI.'
    );
  }
  return String(payload.reply || '');
}

export async function fetchAiInsights(
  financialContext: Record<string, unknown>
): Promise<AiInsightItem[]> {
  const res = await fetch('/api/ai/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ financialContext }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof payload.error === 'string' && payload.error.trim()
        ? payload.error
        : 'Nie udało się wygenerować obserwacji AI.'
    );
  }
  return Array.isArray(payload.insights) ? payload.insights : [];
}
