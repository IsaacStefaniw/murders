import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  FREE_ALWAYS,
  FREE_ALWAYS_ITEMS,
  FREE_FOREVER_PROMISE,
  FREE_MEDITATION_MAX_MIN,
  freeAlwaysSentence,
  isAlwaysFreeProtocol,
  isAlwaysFreeRoutine,
  splitLibrary,
} from '@/features/plus/entitlement';
import type { Protocol } from '@/features/knowledge/protocols';
import type { Routine } from '@/types/domain';

const root = join(__dirname, '..', '..', '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/**
 * The free list, pinned to the code that enforces it.
 *
 * Round three of the persona review still tagged "free tier unclear" on 18%
 * of reviews, and the sentence on the offer card had been typed out by hand
 * — which is how a promise drifts from the rule that keeps it. Both screens
 * now read FREE_ALWAYS, and this is what stops the next screen typing its
 * own version.
 */
describe('what stays free is said from one source', () => {
  const upgrade = read('src/app/upgrade.tsx');
  const nudge = read('src/features/plus/PlusNudge.tsx');

  it('the paywall renders the list rather than typing it', () => {
    expect(upgrade).toContain('FREE_ALWAYS.map');
    expect(upgrade).toContain('FREE_FOREVER_PROMISE');
    // No line of the list may appear as literal text on the screen: a copy
    // of a line is a copy that can be edited without the rule changing.
    for (const line of FREE_ALWAYS) expect(upgrade).not.toContain(line);
  });

  it('the offer card builds its sentence from the same list', () => {
    expect(nudge).toContain('freeAlwaysSentence()');
    expect(nudge).toContain('FREE_FOREVER_PROMISE');
    for (const item of FREE_ALWAYS_ITEMS) expect(nudge).not.toContain(item.short);
  });

  /** Above the prices, because that is where the question is asked. */
  it('the paywall says what is free before it says what it costs', () => {
    const free = upgrade.indexOf('FREE_ALWAYS.map');
    const prices = upgrade.indexOf('Choose how to pay');
    expect(free).toBeGreaterThan(-1);
    expect(prices).toBeGreaterThan(-1);
    expect(free).toBeLessThan(prices);
  });

  it('the sentence and the bullets are the same list, in the same order', () => {
    expect(FREE_ALWAYS).toEqual(FREE_ALWAYS_ITEMS.map((i) => i.line));
    const sentence = freeAlwaysSentence();
    for (const item of FREE_ALWAYS_ITEMS) expect(sentence).toContain(item.short);
    expect(sentence.endsWith('.')).toBe(true);
    // Two items, joined, still read as two things.
    expect(freeAlwaysSentence([{ short: 'one', line: 'One' }, { short: 'two', line: 'Two' }])).toContain(
      'one, and two.',
    );
  });

  it('reads as plain sentences — no letters, no counts, no product words', () => {
    for (const item of FREE_ALWAYS_ITEMS) {
      expect(item.line.length).toBeLessThan(80);
      expect(item.short).toBe(item.short.toLowerCase());
      expect(item.line).not.toMatch(/\d/);
      expect(item.line).not.toMatch(/protocol|pillar|tier|entitlement/i);
    }
  });
});

/**
 * Each promise, against the function that keeps it. A line that no code
 * backs is a line that should not be on the paywall.
 */
describe('every free line is a rule in this file', () => {
  const has = (needle: RegExp) => FREE_ALWAYS.some((l) => needle.test(l));

  it('the hardest moment is named first and enforced', () => {
    expect(FREE_FOREVER_PROMISE).toMatch(/urge/i);
    expect(FREE_FOREVER_PROMISE).toMatch(/free forever/i);
    expect(FREE_FOREVER_PROMISE).toMatch(/hardest moment/i);
    expect(has(/urge/i)).toBe(true);
    expect(isAlwaysFreeProtocol('urge-surf')).toBe(true);
    const urge: Routine = {
      id: 'r1',
      title: 'Ride the urge out',
      protocolId: 'urge-surf',
      days: ['mon'],
      preferredStart: '20:00',
      durationMin: 5,
    } as unknown as Routine;
    expect(isAlwaysFreeRoutine(urge)).toBe(true);
  });

  it('the habits you already have are placed free', () => {
    expect(has(/habits you already have/i)).toBe(true);
    const established = { id: 'r2', established: true } as unknown as Routine;
    expect(isAlwaysFreeRoutine(established)).toBe(true);
  });

  it('the two-minute practices are the free length', () => {
    expect(has(/two-minute/i)).toBe(true);
    expect(FREE_MEDITATION_MAX_MIN).toBe(2);
  });

  it('every program really is viewable by name without Plus', () => {
    expect(has(/full view of every program/i)).toBe(true);
    const listed = [
      { id: 'a1', pillar: 'sleep' },
      { id: 'a2', pillar: 'sleep' },
      { id: 'urge-1', pillar: 'mind' },
    ] as unknown as Protocol[];
    const { total } = splitLibrary(listed, false, 1);
    // Nothing is hidden: the locked ones are counted, and the library
    // screen renders every one of them by name.
    expect(total).toBe(listed.length);
    expect(read('src/app/library.tsx')).toContain('<LockedRow');
  });
});
