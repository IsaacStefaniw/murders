import { z } from 'zod';

import { extractJson, runStructured } from '@/lib/ai/run';
import type { AiProvider } from '@/lib/ai/provider';

const schema = z.object({ ok: z.boolean(), note: z.string() });
const fallback = () => ({ ok: false, note: 'fallback' });

describe('extractJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it('extracts JSON wrapped in prose or fences', () => {
    expect(extractJson('Here you go:\n```json\n{"a": 1}\n```\nDone.')).toEqual({ a: 1 });
  });

  it('throws when no JSON is present', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('runStructured', () => {
  it('uses the fallback when no provider is configured', async () => {
    const { result, source } = await runStructured({
      provider: null,
      system: 's',
      input: 'i',
      schema,
      fallback,
    });
    expect(source).toBe('fallback');
    expect(result.note).toBe('fallback');
  });

  it('returns validated AI output', async () => {
    const provider: AiProvider = {
      complete: async () => '{"ok": true, "note": "ai"}',
    };
    const { result, source } = await runStructured({ provider, system: 's', input: 'i', schema, fallback });
    expect(source).toBe('ai');
    expect(result).toEqual({ ok: true, note: 'ai' });
  });

  it('retries once on invalid output, then succeeds', async () => {
    let calls = 0;
    const provider: AiProvider = {
      complete: async () => {
        calls += 1;
        return calls === 1 ? '{"ok": "not-a-boolean"}' : '{"ok": true, "note": "second try"}';
      },
    };
    const { result, source } = await runStructured({ provider, system: 's', input: 'i', schema, fallback });
    expect(calls).toBe(2);
    expect(source).toBe('ai');
    expect(result.note).toBe('second try');
  });

  it('falls back after two invalid responses without throwing', async () => {
    const provider: AiProvider = { complete: async () => 'garbage' };
    const { result, source } = await runStructured({ provider, system: 's', input: 'i', schema, fallback });
    expect(source).toBe('fallback');
    expect(result.note).toBe('fallback');
  });

  it('falls back when the provider throws (network failure)', async () => {
    const provider: AiProvider = {
      complete: async () => {
        throw new Error('network down');
      },
    };
    const { source } = await runStructured({ provider, system: 's', input: 'i', schema, fallback });
    expect(source).toBe('fallback');
  });
});
