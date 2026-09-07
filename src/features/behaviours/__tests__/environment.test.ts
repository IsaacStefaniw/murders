/**
 * The setup checklist: one per behaviour, written as things to do, with
 * the clinical line where an empty cupboard would be the wrong first move.
 */

import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';
import {
  ENVIRONMENT_CHECKLIST,
  ENVIRONMENT_GUARD,
  environmentDone,
  toggleEnvironmentItem,
} from '@/features/behaviours/environment';

const SHAMING = ['streak', 'fail', 'guilt', 'shame', 'willpower', 'you should', 'relapse', 'cheat', 'weak', 'lazy'];

describe('the setup checklist', () => {
  it('covers every behaviour with at least three concrete items, ids unique within a list', () => {
    for (const info of BEHAVIOUR_CATALOG) {
      const items = ENVIRONMENT_CHECKLIST[info.key];
      expect(items.length).toBeGreaterThanOrEqual(3);
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
      for (const item of items) expect(item.text.length).toBeGreaterThan(15);
    }
  });

  it('is about the room, not the person', () => {
    const text = JSON.stringify(ENVIRONMENT_CHECKLIST).toLowerCase();
    for (const word of SHAMING) expect(text).not.toContain(word);
  });

  it('warns the daily drinker before the alcohol list, and names a doctor', () => {
    expect(ENVIRONMENT_GUARD.alcohol).toMatch(/doctor/);
    expect(ENVIRONMENT_GUARD.alcohol).toMatch(/every day|daily/);
    expect(ENVIRONMENT_GUARD.doomscrolling).toBeUndefined();
  });

  it('routes nicotine and gambling to real help, named generically', () => {
    const vaping = JSON.stringify(ENVIRONMENT_CHECKLIST.vaping);
    const smoking = JSON.stringify(ENVIRONMENT_CHECKLIST.smoking);
    expect(vaping).toMatch(/quitline/i);
    expect(smoking).toMatch(/quitline/i);
    const gambling = JSON.stringify(ENVIRONMENT_CHECKLIST.gambling);
    expect(gambling).toMatch(/bank/i);
    expect(gambling).toMatch(/helpline/i);
    // Generic: no phone number anywhere in the setup.
    expect(JSON.stringify(ENVIRONMENT_CHECKLIST)).not.toMatch(/\d{4}\s?\d{3}/);
  });

  it('the phone habits name the changes the evidence is about', () => {
    const scroll = JSON.stringify(ENVIRONMENT_CHECKLIST.doomscrolling).toLowerCase();
    expect(scroll).toMatch(/kitchen/);
    expect(scroll).toMatch(/notification/);
    expect(scroll).toMatch(/black and white/);
    expect(JSON.stringify(ENVIRONMENT_CHECKLIST.phone_in_bed).toLowerCase()).toMatch(/another room/);
  });

  it('ticks toggle and persist as a flat string', () => {
    let a: Record<string, string> = {};
    a = { environmentDone: toggleEnvironmentItem(a, 'charge-kitchen') };
    a = { environmentDone: toggleEnvironmentItem(a, 'greyscale-evening') };
    expect([...environmentDone(a)]).toEqual(['charge-kitchen', 'greyscale-evening']);
    a = { environmentDone: toggleEnvironmentItem(a, 'charge-kitchen') };
    expect([...environmentDone(a)]).toEqual(['greyscale-evening']);
    expect(environmentDone({}).size).toBe(0);
  });
});
