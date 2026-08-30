/**
 * Structured AI execution: prompt → JSON → Zod validation → typed result.
 * One retry on invalid output, then the deterministic fallback. AI failure
 * must never corrupt user data or block the UI.
 */

import type { ZodType } from 'zod';

import type { AiProvider } from './provider';

export interface StructuredCall<T> {
  provider: AiProvider | null;
  system: string;
  input: string;
  schema: ZodType<T>;
  fallback: () => T;
  maxTokens?: number;
}

/** Extract the first JSON object from a model response. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in response');
  return JSON.parse(text.slice(start, end + 1));
}

export async function runStructured<T>(call: StructuredCall<T>): Promise<{
  result: T;
  source: 'ai' | 'fallback';
}> {
  if (!call.provider) return { result: call.fallback(), source: 'fallback' };

  const systemWithFormat =
    `${call.system}\n\nRespond with a single JSON object only — no prose, no markdown fences.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await call.provider.complete({
        system: systemWithFormat,
        input:
          attempt === 0
            ? call.input
            : `${call.input}\n\nYour previous response was not valid JSON matching the required schema. Return only the JSON object.`,
        maxTokens: call.maxTokens,
      });
      const parsed = call.schema.safeParse(extractJson(text));
      if (parsed.success) return { result: parsed.data, source: 'ai' };
    } catch {
      // Network or parse failure — retry once, then fall back.
    }
  }
  return { result: call.fallback(), source: 'fallback' };
}
