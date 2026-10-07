/**
 * What the Coaches tab says about itself.
 *
 * ── The tab named after the thing he is paying for ──────────────────────
 *
 * Three review sessions as the target persona — 06:40 on a Tuesday, 21:50
 * after a couple of drinks, Sunday morning — and this was the only finding
 * that appeared in all three. Six weeks in, with one coach running, the
 * Coaches tab could not be scrolled past its own onboarding: a text box
 * asking "if life is genuinely working three years from now, what does it
 * look like?"
 *
 * Nothing was broken. The tab was ordered as a brochure and it had never
 * been reordered for anybody who had already read it:
 *
 *   1. two sentences explaining what seven coaches are
 *   2. the three-year question, as the first interactive thing on screen
 *   3. all seven coaches, in definition order, the one that is actually
 *      running given no more room than the six that are not
 *
 * Every line of that is right on day one. By week six it answers a
 * question nobody is asking and buries the one they are. `docs/PERSONA.md`
 * §3.1 is the rule it breaks — eight seconds — and §3.2 is the one it
 * misses: a list of seven things you could configure is not a coach.
 *
 * ── What this module decides ────────────────────────────────────────────
 *
 * Which coaches are running, and the two sentences that say so. The
 * ordering and the moved question live in the screen; the sentences live
 * here because a sentence assembled inline is a sentence nothing can test,
 * and the second one makes a claim about what the person said.
 *
 * ── The one that is coaching rather than reporting ──────────────────────
 *
 * `hubUnmetLine` is the point of the change. The app knows Alex ranked
 * health first and it knows Training and Nutrition have never been
 * started. Those two facts were a tab apart, exactly like the work hours
 * and the routine times in `planner/atWork.ts`, and putting them in one
 * sentence is the whole job:
 *
 *     Training and Nutrition work on health, which you ranked first.
 *
 * It names and stops. No count of weeks wasted, no second person, nothing
 * to beat — the house rules forbid a scoreboard and this is not one. The
 * person may have good reasons; the app's job is to make sure they are
 * choosing rather than not noticing.
 */

import { PATH_AREA, PATH_ORDER, PATHS, type PathId } from '@/features/paths/definitions';
// Area names as they read mid-sentence, which is a different thing from
// the title-case `AREA_LABELS` that report.tsx and plan-review.tsx each
// keep their own (already divergent) copy of. I wrote this map out here
// before finding that weekShape had it, which is the mistake those two
// copies are made of.
import { AREA_WORD } from '@/features/review/weekShape';
import type { LifeArea } from '@/types/domain';

export interface CoachStates {
  /** Started, in definition order. */
  running: PathId[];
  /** Never started, in definition order. */
  idle: PathId[];
  /**
   * The idle coaches of the best-ranked priority that still has one.
   *
   * One area's worth rather than all of them, so the sentence stays a
   * sentence. An area counts as unmet when ANY of its coaches is idle —
   * health has three and Alex runs one, and "Training and Nutrition work
   * on health" is still both true and the thing he came for.
   */
  unmet: PathId[];
  /** Where that area sat in the person's own ordering, 1-based. */
  unmetRank: number | null;
}

/** Up to three, because beyond that nobody is reading a list. */
const RANK_WORD: Record<number, string> = { 1: 'first', 2: 'second', 3: 'third' };

const COUNT_WORD: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
};

/** "Training", "Training and Nutrition", "Training, Nutrition and Money". */
export function coachNames(ids: PathId[]): string {
  const titles = ids.map((id) => PATHS[id].title);
  if (titles.length === 0) return '';
  if (titles.length === 1) return titles[0];
  return `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`;
}

export function coachStates(
  paths: Partial<Record<PathId, unknown>>,
  priorities: LifeArea[] | null | undefined,
): CoachStates {
  const running = PATH_ORDER.filter((p) => paths[p] != null);
  const idle = PATH_ORDER.filter((p) => paths[p] == null);

  // The person's own ordering, in their own order. The first ranked area
  // that still has an idle coach is the one worth a sentence; the rest are
  // true too and saying all of them is how a coaching line becomes a
  // backlog.
  const ranked = priorities ?? [];
  for (let i = 0; i < ranked.length; i += 1) {
    const unmet = idle.filter((p) => PATH_AREA[p] === ranked[i]);
    if (unmet.length > 0) {
      return { running, idle, unmet, unmetRank: i + 1 };
    }
  }
  return { running, idle, unmet: [], unmetRank: null };
}

/**
 * What is running, in one line.
 *
 * Names them while there are few enough to name, counts them when there
 * are not, and never goes quiet: "none yet" is an answer and so is "all
 * seven".
 */
export function hubHeadline(states: CoachStates): string {
  const { running, idle } = states;
  const total = PATH_ORDER.length;

  if (running.length === 0) return `None of the ${COUNT_WORD[total]} are running yet.`;
  if (idle.length === 0) return `All ${COUNT_WORD[total]} are running.`;

  // Few enough running to name them: lead with those.
  if (running.length <= 3) {
    const runs = running.length === 1 ? 'is' : 'are';
    const rest = idle.length === 1 ? 'is' : 'are';
    return `${coachNames(running)} ${runs} running. The other ${COUNT_WORD[idle.length]} ${rest} not.`;
  }

  // Most of them running: the short half is now the ones that are not, and
  // that is the half worth printing.
  const rest = idle.length === 1 ? 'is' : 'are';
  return `${running.length} of ${COUNT_WORD[total]} running — ${coachNames(idle)} ${rest} not.`;
}

/**
 * The coach's own observation, or null when there is nothing to observe.
 *
 * Null is the common case for somebody whose priorities are all covered,
 * and silence there is correct. A line that always appears is decoration.
 */
export function hubUnmetLine(states: CoachStates): string | null {
  const { unmet, unmetRank } = states;
  if (unmet.length === 0 || unmetRank === null) return null;

  const area = AREA_WORD[PATH_AREA[unmet[0]]];
  const verb = unmet.length === 1 ? 'works' : 'work';
  const rank = RANK_WORD[unmetRank];

  return rank
    ? `${coachNames(unmet)} ${verb} on ${area}, which you ranked ${rank}.`
    : `${coachNames(unmet)} ${verb} on ${area}, which you said matters.`;
}
