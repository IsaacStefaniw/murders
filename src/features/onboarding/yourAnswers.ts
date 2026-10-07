/**
 * Which questions to put to this person, and what is held against each.
 *
 * ── Why this is not in the component ────────────────────────────────────
 *
 * Because it was, and two things were wrong with it that only a test
 * makes obvious.
 *
 * It filtered to `kind === 'single'`, with a note that "free text and
 * multi-select belong to their own screens, and a chip row cannot honestly
 * stand in for either" — right about the chip row, wrong about the
 * conclusion. Sixteen of the thirty-eight questions were absent: seven
 * text and nine multi, including `priorities` (which decides the free
 * coach and the shape of the plan), `existingHabits` (PERSONA.md §3.5),
 * and `weight` and `birthYear` (which feed BMI and the age term). On the
 * screen whose own copy promises "change anything that has stopped being
 * true", and for most of them there is nowhere else in the app to do it.
 *
 * And it never consulted `skipIf`, which `deferredSteps` has always
 * honoured. So a question the interview would have skipped for this person
 * was listed anyway AND counted in "n questions have not been put to you
 * yet" — the app reporting a gap it had deliberately decided not to have.
 * The clearest case: `age` is skipped once a real `birthYear` is known, so
 * anybody who gave their birth year was still being told the app did not
 * know how old they were.
 */

import {
  INTERVIEW_STEPS,
  optionsFor,
  type InterviewAnswers,
  type InterviewStep,
} from '@/features/onboarding/script';

/**
 * Answered, as this screen counts it.
 *
 * An empty array is NOT an answer. `answerDeferredQuestion` stores
 * `undefined` for a skipped multi, but a stored `[]` reads as answered to
 * any truthiness check and would hide a real gap.
 */
export function isAnswered(answers: InterviewAnswers, id: string): boolean {
  const value = answers[id];
  if (value === undefined || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Every question that applies, gaps first.
 *
 * A step whose options compute to nothing for this person is dropped:
 * `options` is often a function of earlier answers, and an empty one means
 * the question has nothing to offer rather than that it is unanswered.
 * Text steps have no options and are never dropped for that reason.
 */
export function questionsForPerson(answers: InterviewAnswers): InterviewStep[] {
  const applies = INTERVIEW_STEPS.filter((step) => {
    if (step.skipIf?.(answers)) return false;
    if (step.kind === 'text') return true;
    return optionsFor(step, answers).length > 0;
  });
  // Stable within each group: the script's own order is the order these
  // were designed to be asked in, and shuffling answered questions about
  // would make the screen move under somebody editing it.
  return applies.sort(
    (a, b) => Number(isAnswered(answers, a.id)) - Number(isAnswered(answers, b.id)),
  );
}

/** How many of those have never been put to them. */
export const unansweredCount = (answers: InterviewAnswers): number =>
  questionsForPerson(answers).filter((s) => !isAnswered(answers, s.id)).length;

/**
 * What is currently held, in the words the person chose.
 *
 * Multi keeps the order they chose rather than the option order, because
 * for `priorities` the order IS the answer — the first pick decides the
 * free coach and what wins when two things want the same hour.
 */
export function heldAnswer(
  step: InterviewStep,
  answers: InterviewAnswers,
): string | null {
  if (!isAnswered(answers, step.id)) return null;
  const value = answers[step.id];
  if (step.kind === 'text') return String(value);

  const options = optionsFor(step, answers);
  const label = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  return Array.isArray(value) ? value.map(label).join(', ') : label(String(value));
}
