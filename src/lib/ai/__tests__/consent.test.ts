/**
 * The journal text does not leave the device unless a build says so.
 *
 * "please ensure all of my health data is stored privately for our
 * analysis." The audit found one path out: `analyseReflection` is called
 * from the evening check-in on every save and is handed the free-text
 * answers. It was not leaking, because no Supabase key is configured — an
 * accident of configuration rather than a decision, and two environment
 * variables away from uploading his journal with no prompt.
 */

import { analyseReflection } from '@/lib/ai/agents';
import { AI_JOURNAL_ENABLED } from '@/lib/ai/consent';
import * as provider from '@/lib/ai/provider';
import type { Reflection } from '@/types/domain';

const reflection: Reflection = {
  id: 'r1',
  date: '2026-11-10',
  kind: 'evening',
  mood: 4,
  wentWell: 'Hit the triple at 120.',
  gotInTheWay: 'Craving at the desk from about three.',
  createdAt: '2026-11-10T10:00:00.000Z',
};

describe('the journal analyst is off unless a build turns it on', () => {
  it('is off by default', () => {
    // No EXPO_PUBLIC_AI_JOURNAL in the test environment, as in every build
    // that does not deliberately set it.
    expect(AI_JOURNAL_ENABLED).toBe(false);
  });

  it('never asks for a provider while it is off', async () => {
    // The strong assertion: not "the upload failed", but that the code
    // never even reaches for something that could upload. A provider that
    // appears later — because a key got configured — changes nothing.
    const spy = jest.spyOn(provider, 'getAiProvider');
    await analyseReflection(reflection);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('still returns usable signals, so nothing downstream breaks', async () => {
    const signals = await analyseReflection(reflection);
    // Mood 4 reads positive through the deterministic fallback.
    expect(signals.sentiment).toBe('positive');
    expect(signals.confidence).toBeGreaterThan(0);
  });

  it('derives sentiment from the mood alone, never from the text', async () => {
    const low = await analyseReflection({ ...reflection, mood: 1 });
    const mid = await analyseReflection({ ...reflection, mood: 3 });
    const none = await analyseReflection({ ...reflection, mood: undefined });
    expect([low.sentiment, mid.sentiment, none.sentiment]).toEqual([
      'negative',
      'neutral',
      'neutral',
    ]);
  });

  it('returns no themes rather than inventing them from the text', async () => {
    const signals = await analyseReflection(reflection);
    expect(signals.themes).toEqual([]);
    expect(signals.behaviourMentions).toEqual([]);
  });
});
