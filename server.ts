import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessageInput[];
  financialContext?: Record<string, unknown>;
  analysisMode?: string;
}

interface InsightsRequestBody {
  financialContext?: Record<string, unknown>;
}

const MODE_INSTRUCTIONS: Record<string, string> = {
  chat: 'Odpowiedz precyzyjnie na pytanie użytkownika na podstawie dostarczonych danych finansowych.',
  spending_analysis:
    'Wykonaj szczegółową analizę wydatków: wskaż największe kategorie wydatków, główne pozycje kosztowe i porównaj je z budżetami.',
  savings_recommendations:
    'Zaproponuj realistyczne, konkretne sposoby na zwiększenie miesięcznych oszczędności w oparciu o rzeczywiste kategorie wydatków użytkownika.',
  monthly_report:
    'Wygeneruj czytelny miesięczny raport finansowy: podsumowanie przychodów, wydatków, oszczędności netto, stopy oszczędności oraz realizacji budżetów.',
  pattern_detection:
    'Przeanalizuj historię transakcji i wskaż nietypowe wzorce wydatków, powtarzające się obciążenia oraz obszary o wysokiej zmienności.',
  budget_recommendations:
    'Zaproponuj optymalne miesięczne limity budżetowe dla poszczególnych kategorii na podstawie historycznych wydatków użytkownika.',
  financial_forecast:
    'Oszacuj prognozowane wydatki i potencjalne oszczędności na kolejny miesiąc na podstawie średnich historycznych oraz płatności cyklicznych. Wyraźnie zaznacz, które liczby to prognozy/szacunki, a które to potwierdzone dane historyczne.',
};

function buildSystemInstruction(analysisMode: string, financialContext: Record<string, unknown>): string {
  const modeGuidance = MODE_INSTRUCTIONS[analysisMode] || MODE_INSTRUCTIONS.chat;

  return [
    'Jesteś MoneyMind AI — osobistym asystentem finansowym w polskiej aplikacji MoneyMind.',
    'ZASADY KRYTYCZNE (NIE DO ZŁAMANIA):',
    '1. Korzystaj WYŁĄCZNIE z rzeczywistych danych finansowych przekazanych poniżej w JSON. NIGDY nie wymyślaj transakcji, sald, kwot ani statystyk.',
    '2. Jeśli w danych brakuje informacji potrzebnych do odpowiedzi (np. brak transakcji w danej kategorii lub brak danych z poprzedniego miesiąca), powiedz o tym wprost.',
    '3. Wyraźnie rozróżniaj potwierdzone dane historyczne (np. „Potwierdzone wydatki z bieżącego miesiąca”) od szacunków i prognoz (np. „Szacowana prognoza na kolejny miesiąc”).',
    '4. Nigdy nie przedstawiaj porad inwestycyjnych jako gwarantowanych zysków ani obietnic zwrotu.',
    '5. Odpowiadaj zawsze po polsku, używaj polskich formatów walutowych i konkretnych liczb z danych użytkownika.',
    '6. Na końcu każdej odpowiedzi dodaj krótkie zastrzeżenie: „*Zastrzeżenie: Powyższe informacje mają charakter wyłącznie informacyjno-edukacyjny i nie stanowią profesjonalnej porady finansowej ani inwestycyjnej.*”',
    `TRYB ANALIZY: ${modeGuidance}`,
    'RZECZYWISTE DANE FINANSOWE UŻYTKOWNIKA (JSON):',
    JSON.stringify(financialContext),
  ].join('\n\n');
}

function mapGeminiError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('400')) {
    return {
      status: 502,
      message:
        'Błąd autoryzacji klucza Gemini API. Sprawdź poprawność klucza w panelu Settings > Secrets.',
    };
  }
  if (lower.includes('429') || lower.includes('resource_exhausted')) {
    return {
      status: 429,
      message:
        'Przekroczono limit zapytań do Gemini API. Spróbuj ponownie za chwilę lub sprawdź limity klucza w Settings > Secrets.',
    };
  }
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 502,
      message: `Wybrany model AI (${MODEL_NAME}) nie jest dostępny dla bieżącego klucza API.`,
    };
  }

  return {
    status: 500,
    message: 'Nie udało się uzyskać odpowiedzi od MoneyMind AI. Spróbuj ponownie za chwilę.',
  };
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const hasKey = Boolean(getGeminiClient());
    res.json({ ok: true, aiConfigured: hasKey });
  });

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Asystent MoneyMind AI wymaga skonfigurowania klucza GEMINI_API_KEY po stronie serwera (Settings > Secrets).',
        });
        return;
      }

      const body = (req.body || {}) as ChatRequestBody;
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const financialContext = body.financialContext || {};
      const analysisMode = typeof body.analysisMode === 'string' ? body.analysisMode : 'chat';

      if (messages.length === 0) {
        res.status(400).json({ error: 'Brak wiadomości do przetworzenia.' });
        return;
      }

      const contents = messages.slice(-12).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content || '').slice(0, 4000) }],
      }));

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(analysisMode, financialContext),
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'Model AI zwrócił pustą odpowiedź. Spróbuj ponownie.' });
        return;
      }

      res.json({ reply });
    } catch (error) {
      console.error('Gemini chat error:', error);
      const mapped = mapGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/ai/insights', async (req: Request, res: Response) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Generowanie obserwacji AI wymaga skonfigurowania klucza GEMINI_API_KEY w Settings > Secrets.',
        });
        return;
      }

      const body = (req.body || {}) as InsightsRequestBody;
      const financialContext = body.financialContext || {};

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents:
          'Przeanalizuj rzeczywiste dane finansowe użytkownika i przygotuj 3 zwięzłe, praktyczne obserwacje po polsku. Bazuj wyłącznie na przekazanych liczbach.',
        config: {
          systemInstruction: buildSystemInstruction('pattern_detection', financialContext),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'Krótki tytuł obserwacji finansowej po polsku (maks. 70 znaków).',
                },
                message: {
                  type: Type.STRING,
                  description:
                    'Konkretna obserwacja z rzeczywistymi kwotami i rozróżnieniem faktów od szacunków.',
                },
                severity: {
                  type: Type.STRING,
                  description: 'Poziom ważności: info, warning albo success.',
                },
              },
              required: ['title', 'message', 'severity'],
            },
          },
        },
      });

      const rawText = (response.text ?? '[]').trim();
      let parsed: Array<{ title: string; message: string; severity: string }> = [];
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = [];
      }

      res.json({ insights: Array.isArray(parsed) ? parsed.slice(0, 4) : [] });
    } catch (error) {
      console.error('Gemini insights error:', error);
      const mapped = mapGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MoneyMind server running at http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
