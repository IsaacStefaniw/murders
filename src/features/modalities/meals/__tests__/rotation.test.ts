import { DINNER_IDEAS, nextIdea, suggestWeek } from '@/features/modalities/meals/rotation';

describe('dinner rotation', () => {
  it('fills all seven nights deterministically, leftovers night included', () => {
    const week = suggestWeek('2026-09-06');
    expect(Object.keys(week)).toHaveLength(7);
    expect(week[4]).toBe('Leftovers night');
    expect(suggestWeek('2026-09-06')).toEqual(week);
    // A different week starts differently — no groundhog-day menus.
    expect(suggestWeek('2026-09-13')).not.toEqual(week);
  });

  it('cycles through every idea without repeating until the list wraps', () => {
    const seen = new Set<string>();
    let current = DINNER_IDEAS[0];
    for (let i = 0; i < DINNER_IDEAS.length; i++) {
      seen.add(current);
      current = nextIdea(current);
    }
    expect(seen.size).toBe(DINNER_IDEAS.length);
    expect(current).toBe(DINNER_IDEAS[0]);
  });

  it('every idea reads as food, not macros', () => {
    for (const idea of DINNER_IDEAS) {
      expect(idea).not.toMatch(/calorie|protein|macro|carb(?!onara)|gram/i);
    }
  });
});
