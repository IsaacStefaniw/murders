/**
 * Saying out loud which part of life won the day.
 *
 * ── Why this is the most important screen in the app ────────────────────
 *
 * IntentNorth holds seven coaches. To anyone looking at it, that is seven
 * half-apps competing with specialists that each do one thing better. The
 * single answer to that is cross-domain arbitration: when training and
 * family and work all want the same evening, something has to give, and
 * IntentNorth is the only one of them that can decide, because it is the only
 * one holding all three.
 *
 * That arbitration now works. It has, until this file, been completely
 * invisible. The engine computed exactly which routines it could not fit,
 * and the store destructured the answer into `_unplaced` and threw it
 * away. So the product's entire differentiator ran perfectly, silently,
 * and left no trace on any screen a person would ever see.
 *
 * A decision nobody is told about is indistinguishable from no decision.
 * Worse, in a planning app it reads as a bug: things you asked for quietly
 * are not there, and the app never mentions it.
 *
 * ── Moves, not just drops ───────────────────────────────────────────────
 *
 * The first version of this only spoke when something was DROPPED, and in
 * practice that almost never happens. A day rarely refuses anything: five
 * routines competing for one evening all get placed, because flexible ones
 * spill into whatever gap is left. Filming it proved the point — a
 * deliberately overloaded evening produced zero drops and one routine
 * quietly parked at 8:15 in the morning.
 *
 * So the visible half of arbitration is the MOVE. Four things shifted and
 * one kept its hour, and which one kept it is the decision worth naming.
 *
 * ── The rules for what gets said ────────────────────────────────────────
 *
 * NAME THE WINNER, NOT THE LOSER. "The evening went to family" is a plan
 * doing its job. "You failed to fit your workout" is a scolding, and the
 * fastest route to someone deciding the app is another thing nagging them.
 *
 * ONLY EXPLAIN WHAT THE PERSON CHOSE. When something is dropped because
 * the day was simply full rather than because a priority beat it, say
 * that instead. Attributing a mechanical outcome to someone's stated
 * values would put words in their mouth.
 *
 * NEVER APOLOGISE FOR A FULL DAY. A day that cannot hold everything is
 * the normal case and the reason to have a plan at all.
 */

import type { LifeArea, Routine } from '@/types/domain';

/** Enough of a displaced routine to explain it, and nothing more. */
export interface Displaced {
  title: string;
  area: LifeArea;
  /** The area that took the time, when a stated priority decided it. */
  lostTo?: LifeArea;
  /** Set when the routine still happens, just not when it wanted to. */
  movedTo?: string;
}

const AREA_WORDS: Record<LifeArea, string> = {
  family: 'family',
  relationship: 'your relationship',
  health: 'health',
  work: 'work',
  growth: 'growth',
  enjoyment: 'enjoyment',
  admin: 'money',
};

export function areaWord(area: LifeArea): string {
  return AREA_WORDS[area] ?? area;
}

/**
 * Work out what to record about the things that did not fit.
 *
 * `kept` is what made it into the day. A dropped routine is attributed to
 * a stated priority only when something from a HIGHER-RANKED area actually
 * took time in that day — otherwise the day was just full, and saying
 * "family won" when family was not even scheduled would be a fiction.
 */
export function describeDisplaced(
  unplaced: Routine[],
  kept: { area: LifeArea }[],
  priorities: LifeArea[],
): Displaced[] {
  const rank = (area: LifeArea) => {
    const i = priorities.indexOf(area);
    return i === -1 ? priorities.length : i;
  };

  return unplaced.map((r) => {
    const beatenBy = kept
      .filter((k) => rank(k.area) < rank(r.area))
      .sort((a, b) => rank(a.area) - rank(b.area))[0];
    return {
      title: r.title,
      area: r.area,
      lostTo: beatenBy?.area,
    };
  });
}

/**
 * One sentence for the whole group.
 *
 * Grouped rather than per-item deliberately: three separate lines saying
 * three things did not fit reads as three failures, where one line saying
 * the evening went to family reads as a decision — which is what it is.
 */
/**
 * The things that moved, and what took their hour.
 *
 * A move is only attributed when something from a HIGHER-RANKED area is
 * actually sitting in the window the routine wanted. A day that simply ran
 * out of room moved things for mechanical reasons, and dressing that up as
 * a values decision would be a lie told in a friendly voice.
 */
export function describeMoved(
  moved: { routine: { title: string; area: LifeArea; durationMin: number }; from: number; to: number }[],
  kept: { area: LifeArea; start: string; end: string }[],
  priorities: LifeArea[],
): Displaced[] {
  const rank = (area: LifeArea) => {
    const i = priorities.indexOf(area);
    return i === -1 ? priorities.length : i;
  };
  const mins = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const out: Displaced[] = [];
  for (const m of moved) {
    const wantedStart = m.from;
    const wantedEnd = m.from + m.routine.durationMin;
    const occupier = kept
      .filter((k) => mins(k.start) < wantedEnd && mins(k.end) > wantedStart)
      .filter((k) => rank(k.area) < rank(m.routine.area))
      .sort((a, b) => rank(a.area) - rank(b.area))[0];
    if (!occupier) continue; // moved for mechanical reasons — say nothing
    out.push({
      title: m.routine.title,
      area: m.routine.area,
      lostTo: occupier.area,
      movedTo: toClock(m.to),
    });
  }
  return out;
}

function toClock(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`;
}

export function displacedLine(displaced: Displaced[]): string | null {
  if (displaced.length === 0) return null;

  // A move is the common case and reads far better than a drop: the thing
  // still happens, it just happens later, and the person learns why.
  const movedOnes = displaced.filter((d) => d.movedTo && d.lostTo);
  if (movedOnes.length > 0) {
    const first = movedOnes[0];
    if (movedOnes.length === 1) {
      return `${first.title} moved to ${first.movedTo} — ${areaWord(first.lostTo!)} had the hour it wanted, and that is the order you set.`;
    }
    return `${movedOnes.length} things moved to make room for ${areaWord(first.lostTo!)} — the order you set. ${first.title} is now at ${first.movedTo}.`;
  }

  const decided = displaced.filter((d) => d.lostTo !== undefined);

  if (decided.length === 0) {
    return displaced.length === 1
      ? `${displaced[0].title} did not fit today — the day was full before it got a turn.`
      : `${displaced.length} things did not fit today. The day was full; they are still in the plan for another day.`;
  }

  // The winning area is the highest-ranked one that actually took time.
  const winner = decided[0].lostTo!;
  const what =
    displaced.length === 1
      ? displaced[0].title
      : `${displaced.length} things`;

  return `${what} gave way to ${areaWord(winner)} today — the order you set.`;
}
