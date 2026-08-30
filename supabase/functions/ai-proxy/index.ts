// Supabase Edge Function: ai-proxy
//
// The only place model API keys live. The client sends a system prompt and a
// minimised input; this function forwards them to the model vendor and
// returns plain text. Swap vendors here without touching the app.
//
// Deploy: supabase functions deploy ai-proxy
// Secrets: supabase secrets set ANTHROPIC_API_KEY=...
//
// Requests must carry a valid Supabase auth JWT (verify_jwt is enabled by
// default for edge functions), so only signed-in users can spend tokens.

// @ts-nocheck — Deno runtime, not part of the app's TypeScript project.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';
const MAX_INPUT_CHARS = 20_000;
const MAX_OUTPUT_TOKENS = 2_048;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: 'AI is not configured' }, 503);
  }

  let body: { system?: string; input?: string; max_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const system = typeof body.system === 'string' ? body.system : '';
  const input = typeof body.input === 'string' ? body.input : '';
  if (!system || !input || system.length + input.length > MAX_INPUT_CHARS) {
    return json({ error: 'invalid input' }, 400);
  }
  const maxTokens = Math.min(
    Number.isFinite(body.max_tokens) ? Number(body.max_tokens) : 1024,
    MAX_OUTPUT_TOKENS,
  );

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: input }],
    }),
  });

  if (!response.ok) {
    // Never leak vendor error bodies (they can include request echoes).
    return json({ error: 'AI request failed' }, 502);
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('')
    : '';

  return json({ text });
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
