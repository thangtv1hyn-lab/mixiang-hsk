import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const FREE_PRIMARY_MODEL = 'gemini-4-hydrogen';
export const FREE_FAST_MODEL = 'gemini-3.1-flash-lite';

export function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface FreeGenerateOptions {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  /** Prefer fast lite model first (e.g. short chat/pronunciation) or primary hydrogen first */
  preferFast?: boolean;
  /** Per-attempt timeout in milliseconds */
  timeoutMs?: number;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms (${label})`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Generates text using 100% Free Gemini API models with bounded timeout and
 * automatic fallback between free models ('gemini-4-hydrogen' <-> 'gemini-3.1-flash-lite')
 * so requests stay fast and never hang past gateway timeouts.
 */
export async function generateWithFreeGemini(
  options: FreeGenerateOptions
): Promise<{ text: string; model: string }> {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error('MISSING_API_KEY');
  }

  const {
    contents,
    systemInstruction,
    responseMimeType,
    preferFast = false,
    timeoutMs = 20000,
  } = options;

  const models = preferFast
    ? [FREE_FAST_MODEL, FREE_PRIMARY_MODEL]
    : [FREE_PRIMARY_MODEL, FREE_FAST_MODEL];

  let lastError: any = null;

  for (const model of models) {
    const start = Date.now();
    try {
      const config: Record<string, any> = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (responseMimeType) config.responseMimeType = responseMimeType;

      // Apply appropriate low-latency thinking level per model capability
      if (model === FREE_PRIMARY_MODEL) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (model === FREE_FAST_MODEL) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        timeoutMs,
        model
      );

      const text = (response.text || '').trim();
      if (!text) {
        throw new Error(`Empty response from ${model}`);
      }

      console.log(`[Gemini Free] ${model} succeeded in ${Date.now() - start}ms`);
      return { text, model };
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[Gemini Free] ${model} failed after ${Date.now() - start}ms:`,
        err?.status || '',
        err?.message || err
      );
    }
  }

  throw lastError || new Error('All free Gemini models failed');
}
