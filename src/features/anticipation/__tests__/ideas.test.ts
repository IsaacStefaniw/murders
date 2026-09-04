import type { LifeProfile } from '@/types/domain';
import { ideasFor } from '../lookAhead';

const profile = (extra: Partial<LifeProfile> = {}): LifeProfile =>
  ({ people: [{ id: 'p1', name: 'Anna', relation: 'partner' }], moreOf: [], ...extra }) as unknown as LifeProfile;

describe('ideas fit the time of day they are offered for', () => {
  it('a morning gap never suggests dinner or date night', () => {
    const morning = ideasFor(profile(), 'morning');
    expect(morning.length).toBeGreaterThan(0);
    for (const idea of morning) expect(idea).not.toMatch(/dinner|date night/i);
  });

  it('an evening gap can', () => {
    expect(ideasFor(profile(), 'evening')).toContain('Date night');
  });

  it('the person’s own interests come first in the slot', () => {
    expect(ideasFor(profile({ moreOf: ['Time outdoors'] }), 'morning')[0]).toBe('Breakfast out, just the two of you');
    expect(ideasFor(profile({ people: [], moreOf: ['Time outdoors'] }), 'morning')[0]).toBe('A morning outdoors');
  });

  it('with no slot the list is still three ideas, no duplicates', () => {
    const all = ideasFor(profile());
    expect(all).toHaveLength(3);
    expect(new Set(all).size).toBe(3);
  });
});
