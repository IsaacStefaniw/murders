import { composeGoalDraft } from '@/features/goals/composer';
import { parseGoal } from '@/features/goals/goalPlanner';
import { ALL_PRESETS, PRESET_GROUPS } from '@/features/goals/presets';

/**
 * A preset is an input, not a parallel system: it is the sentence someone
 * would have typed if they knew how, and it goes through the same parser
 * and composer as free text. These tests are what keep that true — the
 * moment a preset needs its own ladder-building path, the promise is gone.
 */
describe('every preset', () => {
  it.each(ALL_PRESETS.map((p) => [p.label, p] as const))(
    '%s parses to the domain it claims and drafts a real ladder',
    (_label, preset) => {
      const parsed = parseGoal(preset.text);
      expect(parsed.domain).toBe(preset.domain);

      const draft = composeGoalDraft(parsed, null);
      expect(draft.goal.title.length).toBeGreaterThan(0);
      expect(draft.goal.milestones?.length ?? 0).toBeGreaterThanOrEqual(2);
    },
  );

  it('has a unique id', () => {
    const ids = ALL_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * A goal shown without what it will cost is a wish, and accepting six
   * wishes in one sitting is the whole failure mode of goal-setting apps.
   */
  it('says what it will cost, in weeks rather than in adjectives', () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.commitment.length).toBeGreaterThan(10);
      expect(preset.commitment).not.toMatch(/easy|simple|just|quick/i);
    }
  });

  it('is shorter on the shelf than it is as a goal', () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.label.length).toBeLessThanOrEqual(preset.text.length);
    }
  });
});

describe('the shelf', () => {
  it('covers every coach, so no pathway is unreachable from here', () => {
    const paths = new Set(ALL_PRESETS.map((p) => p.path).filter(Boolean));
    expect(paths).toEqual(
      new Set(['training', 'nutrition', 'money', 'work', 'recovery', 'relationship', 'family']),
    );
  });

  it('is browsable rather than a wall — no group is longer than a screen', () => {
    for (const group of PRESET_GROUPS) {
      expect(group.presets.length).toBeGreaterThan(0);
      expect(group.presets.length).toBeLessThanOrEqual(4);
    }
  });
});
