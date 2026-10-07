/**
 * "About you" — the missing half of the interview.
 *
 * Isaac: "can you take the new questionnaire at any time?" The screen was
 * built to answer that and then showed less than half of it. These tests
 * are the two things that were wrong, pinned so they cannot come back.
 */

import { INTERVIEW_STEPS } from '@/features/onboarding/script';
import {
  heldAnswer,
  isAnswered,
  questionsForPerson,
  unansweredCount,
} from '@/features/onboarding/yourAnswers';
import type { InterviewAnswers } from '@/features/onboarding/script';

const step = (id: string) => INTERVIEW_STEPS.find((s) => s.id === id)!;

/** Enough answers that the option-generating steps have options. */
const base: InterviewAnswers = {
  name: 'Alex',
  weekShape: 'employed',
  priorities: ['health', 'work', 'growth'],
  household: [],
};

describe('every kind of question reaches the screen', () => {
  const ids = questionsForPerson(base).map((s) => s.id);

  /**
   * The screen filtered to `kind === 'single'`, which left sixteen of the
   * thirty-eight out: seven text and nine multi.
   */
  it('includes the text questions it used to drop', () => {
    for (const id of ['vision', 'ambition', 'weight', 'birthYear']) {
      expect(ids).toContain(id);
    }
  });

  it('includes the multi-select questions it used to drop', () => {
    for (const id of ['priorities', 'existingHabits', 'moreOf', 'lessOf', 'constraints']) {
      expect(ids).toContain(id);
    }
  });

  it('includes the ones it always showed', () => {
    for (const id of ['capacity', 'trainingExperience', 'selfRatedHealth']) {
      expect(ids).toContain(id);
    }
  });

  it('shows a substantial number that the single-only filter hid', () => {
    // The claim is not "more questions" in the abstract — it is that the
    // text and multi ones now appear at all. Counting those directly says
    // that; comparing totals against a ratio was a heuristic that landed
    // on its own boundary and told me nothing.
    const shown = questionsForPerson(base);
    const previouslyHidden = shown.filter((s) => s.kind !== 'single');
    expect(previouslyHidden.length).toBeGreaterThanOrEqual(12);
    expect(previouslyHidden.filter((s) => s.kind === 'text').length).toBeGreaterThanOrEqual(5);
    expect(previouslyHidden.filter((s) => s.kind === 'multi').length).toBeGreaterThanOrEqual(6);
  });
});

describe('questions that do not apply are not gaps', () => {
  /**
   * `skipIf` was never consulted here, where `deferredSteps` has always
   * honoured it. The clearest consequence: `age` is skipped once a real
   * birth year is known, so anybody who had given theirs was still being
   * told the app did not know how old they were.
   */
  it('stops asking your age once it has your birth year', () => {
    expect(questionsForPerson(base).map((s) => s.id)).toContain('age');
    const withYear = { ...base, birthYear: '1992' };
    expect(questionsForPerson(withYear).map((s) => s.id)).not.toContain('age');
  });

  it('does not ask how many kids somebody without kids has', () => {
    expect(questionsForPerson(base).map((s) => s.id)).not.toContain('kidsCount');
    const withKids = { ...base, household: ['kids'] };
    expect(questionsForPerson(withKids).map((s) => s.id)).toContain('kidsCount');
  });

  it("does not ask for a partner's name when there is no partner", () => {
    expect(questionsForPerson(base).map((s) => s.id)).not.toContain('partnerName');
    expect(questionsForPerson({ ...base, household: ['partner'] }).map((s) => s.id)).toContain(
      'partnerName',
    );
  });

  it('leaves a skipped question out of the count, not just out of the list', () => {
    // The count is what the screen's headline sentence is built from, so
    // counting a question it has decided not to ask is the app reporting a
    // hole it chose not to have.
    const before = unansweredCount(base);
    const after = unansweredCount({ ...base, birthYear: '1992' });
    // One answered AND one no longer asked, so the count falls by two.
    expect(before - after).toBe(2);
  });
});

describe('what counts as answered', () => {
  it('treats an empty multi-select as unanswered', () => {
    // `answerDeferredQuestion` stores undefined for a skip, but a stored
    // [] reads as answered to any truthiness check and would hide a gap.
    expect(isAnswered({ moreOf: [] }, 'moreOf')).toBe(false);
    expect(isAnswered({ moreOf: ['Seeing friends'] }, 'moreOf')).toBe(true);
  });

  it('treats an empty string as unanswered', () => {
    expect(isAnswered({ vision: '' }, 'vision')).toBe(false);
    expect(isAnswered({ vision: 'Fit and still enjoying it' }, 'vision')).toBe(true);
  });

  it('treats a missing key as unanswered', () => {
    expect(isAnswered({}, 'vision')).toBe(false);
  });

  it('puts the gaps first', () => {
    const ordered = questionsForPerson({ ...base, capacity: 'push' });
    const firstAnswered = ordered.findIndex((s) => isAnswered({ ...base, capacity: 'push' }, s.id));
    const lastGap = ordered
      .map((s) => isAnswered({ ...base, capacity: 'push' }, s.id))
      .lastIndexOf(false);
    expect(lastGap).toBeLessThan(firstAnswered);
  });
});

describe('what is held, in their words', () => {
  it('reads a single choice back by its label, not its value', () => {
    expect(heldAnswer(step('capacity'), { ...base, capacity: 'push' })).toBe('Room to push');
  });

  it('reads text back as written', () => {
    expect(heldAnswer(step('vision'), { ...base, vision: 'In the best shape of my life' })).toBe(
      'In the best shape of my life',
    );
  });

  /**
   * The order is the answer. `priorities` decides the free coach and what
   * wins when two things want the same hour, so reading it back in option
   * order would show somebody a ranking they did not choose.
   */
  it('keeps the order a multi-select was chosen in', () => {
    const chosen = { ...base, priorities: ['work', 'health'] };
    expect(heldAnswer(step('priorities'), chosen)).toBe('Work & business, Health');
    const other = { ...base, priorities: ['health', 'work'] };
    expect(heldAnswer(step('priorities'), other)).toBe('Health, Work & business');
  });

  it('says nothing where nothing is held', () => {
    expect(heldAnswer(step('vision'), base)).toBeNull();
    expect(heldAnswer(step('moreOf'), { ...base, moreOf: [] })).toBeNull();
  });

  it('falls back to the raw value rather than printing nothing', () => {
    // A stored answer whose option has since been removed from the script
    // is still their answer, and showing a blank would read as unanswered.
    expect(heldAnswer(step('capacity'), { ...base, capacity: 'gone' })).toBe('gone');
  });
});
