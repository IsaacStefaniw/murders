/**
 * The house rule, made checkable.
 *
 * "No scores, no percentages, no streaks, no adherence grade. A missed
 * Tuesday is a missed Tuesday, never a reset to zero." It is the hardest
 * rule in this product to hold and the easiest to lose to a well-argued
 * feature request, and it had already been lost in four places at once
 * without anybody noticing — including twice on screens whose own copy
 * says they do not do this:
 *
 *   report.tsx:111          "{rate}%" / "of plans kept", in `title` — the
 *                           largest numeral in the entire product, three
 *                           lines under "No grades — just what happened."
 *   data.tsx:391            "Plans you kept", as a percentage, on a screen
 *                           whose header reads "no adherence percentage,
 *                           no streak, no grade."
 *   data.tsx:394            "Weeks in a row with something done" — a
 *                           streak that resets, eighty lines below "Not a
 *                           streak — a missed Tuesday is a missed Tuesday,
 *                           not a reset to zero."
 *   WeeklyReviewPanel:142   "{n}% of planned activities happened."
 *
 * None of it was found by two rounds of code review. All of it was found
 * in an afternoon by an agent that looked at screenshots, which is the
 * whole argument for reviewing the app rather than the repo.
 *
 * So the rule is a test now. It reads the source, because the thing being
 * prevented is a line of JSX, and a reviewer arguing well is exactly how
 * it got in the first four times.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments are where the reasoning lives, and reasoning is not a screen. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const FILES = sourceFiles(SRC);
const rel = (f: string) => f.slice(SRC.length + 1);

describe('no percentage that scores a person', () => {
  /**
   * The measurements that are genuinely denominated in per cent stay.
   * HbA1c IS a percentage; body fat IS a percentage; a savings rate is a
   * financial quantity somebody chose to track. What is banned is turning
   * "what you did" into "what fraction of what you said you would".
   */
  const MEASUREMENTS = /BloodPanel|BodyNumbers|MoneyHub|charts\.tsx/;

  it('never renders a completion or adherence rate as a percentage', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      if (MEASUREMENTS.test(file)) continue;
      const src = stripComments(readFileSync(file, 'utf8'));
      // A rate multiplied into a percent, anywhere it could reach a screen.
      if (/(completionRate|adherence|planned|kept)[^;\n]{0,60}\*\s*100/i.test(src)) {
        offenders.push(rel(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the honest measurements that really are percentages', () => {
    // The rule is not "no % character". Deleting a body-fat reading would
    // be following the letter of this and breaking its purpose.
    const body = readFileSync(join(SRC, 'features/health/BodyNumbers.tsx'), 'utf8');
    expect(body).toMatch(/%/);
  });
});

describe('no streak', () => {
  /**
   * A streak is not the word — it is the reset. Anything counting
   * CONSECUTIVE units of time and stopping at the first zero takes a
   * person's whole history away for one bad week, which is the specific
   * cruelty this product refuses.
   */
  it('exposes no consecutive-run counter to a screen', () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const src = stripComments(readFileSync(file, 'utf8'));
      if (/\b(weekStreak|dayStreak|activeWeekStreak|currentStreak|streakCount)\b/.test(src)) {
        offenders.push(rel(file));
      }
      if (/in a row/i.test(src)) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * The two screens that say out loud that they do not score people. If the
 * copy stays and the behaviour goes, the copy becomes a lie — which is
 * worse than never having made the promise.
 */
describe('the screens that promise this in their own copy', () => {
  it('Progress still says it, and still means it', () => {
    const src = readFileSync(join(SRC, 'app/(tabs)/data.tsx'), 'utf8');
    expect(src).toMatch(/no adherence[\s\S]{0,40}no streak/i);
    expect(stripComments(src)).not.toMatch(/in a row/i);
  });

  it('the weekly report still says it, and still means it', () => {
    const src = readFileSync(join(SRC, 'app/report.tsx'), 'utf8');
    expect(src).toMatch(/No grades/);
    expect(stripComments(src)).not.toMatch(/\* 100/);
  });
});
