/**
 * AI provider abstraction.
 *
 * The app talks to `AiProvider`, never to a vendor SDK. The default
 * implementation calls the `ai-proxy` Supabase Edge Function, which holds
 * the model API key server-side — no AI credentials ever ship in the app.
 * Swapping model vendors is a server-side change.
 */

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export interface AiRequest {
  system: string;
  /** Single user message. Content must already be minimised (no PII beyond what the task needs). */
  input: string;
  maxTokens?: number;
}

export interface AiProvider {
  complete(request: AiRequest): Promise<string>;
}

class EdgeFunctionProvider implements AiProvider {
  async complete(request: AiRequest): Promise<string> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        system: request.system,
        input: request.input,
        max_tokens: request.maxTokens ?? 1024,
      },
    });
    if (error) throw error;
    const text = (data as { text?: string } | null)?.text;
    if (typeof text !== 'string') throw new Error('ai-proxy returned no text');
    return text;
  }
}

/** null when AI is unavailable — callers must degrade gracefully. */
export function getAiProvider(): AiProvider | null {
  if (!isSupabaseConfigured()) return null;
  return new EdgeFunctionProvider();
}
