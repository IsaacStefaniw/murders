/**
 * Anticipation engine v1.
 *
 * A healthy week is not obligations completed efficiently — it needs
 * something to look forward to. This module (a) surfaces the week's
 * meaningful upcoming moments, (b) names the gaps ("Saturday morning —
 * nothing planned yet"), and (c) at most once a week, when the days ahead
 * hold nothing enjoyable at all, suggests one thing drawn from the user's
 * own interests. One good suggestion beats ten mediocre ones.
 */

import { addDays, dateKeyToDate, newId, weekdayOf } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem, Routine, Suggestion } from '@/types/domain';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface LookAheadEntry {
  key: string;
  /** "Friday", "Saturday", "Next weekend" */
  when: string;
  date: string;
  title: string;
  /** An existing plan item vs. an open gap inviting a plan. */
  kind: 'moment' | 'gap';
  start?: string;
}

/** Enjoyable-thing ideas drawn from the user's own interests, not a catalog. */
export function ideasFor(profile: LifeProfile): string[] {
  const ideas: string[] = [];
  const hasPartner = profile.people.some((p) => p.relation === 'partner');
  const hasKids = profile.people.some((p) => p.relation === 'child');
  if (hasKids) ideas.push('A family adventure');
  if (hasPartner) ideas.push('Date night');
  if (profile.moreOf.includes('Seeing friends')) ideas.push('Catch up with a friend');
  if (profile.moreOf.includes('Adventure & travel')) ideas.push('Plan the next adventure');
  if (profile.moreOf.includes('Time outdoors') || profile.trainingPreference === 'outdoors') {
    ideas.push('A morning outdoors');
  }
  if (ideas.length < 3) ideas.push('Dinner somewhere new');
  if (ideas.length < 3) ideas.push('A morning to yourself');
  return ideas.slice(0, 3);
}

function isSpecial(item: PlanItem, everydayRoutineIds: Set<string>): boolean {
  return (
    !item.fixed &&
    item.status === 'planned' &&
    !(item.routineId && everydayRoutineIds.has(item.routineId)) &&
    (item.area === 'relationship' || item.area === 'family' || item.area === 'enjoyment')
  );
}

export function buildLookingAhead(
  today: string,
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  profile: LifeProfile,
): LookAheadEntry[] {
  const everyday = new Set(routines.filter((r) => r.days.length >= 6).map((r) => r.id));
  const partner = profile.people.find((p) => p.relation === 'partner');
  const entries: LookAheadEntry[] = [];
  const seenTitles = new Set<string>();

  for (let i = 1; i <= 6 && entries.length < 3; i++) {
    const date = addDays(today, i);
    const item = (plans[date]?.items ?? []).find(
      (it) => isSpecial(it, everyday) && !seenTitles.has(it.title),
    );
    if (item) {
      seenTitles.add(item.title);
      entries.push({
        key: item.id,
        when: WEEKDAYS[dateKeyToDate(date).getDay()],
        date,
        title:
          item.title === 'Date night' && partner ? `Date night with ${partner.name}` : item.title,
        kind: 'moment',
        start: item.start,
      });
    }
  }

  // Weekend gaps within the coming week: an open Saturday/Sunday morning is
  // an invitation, not a failure.
  for (let i = 1; i <= 6 && entries.length < 3; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    if (weekday !== 6 && weekday !== 0) continue;
    const hasSpecial = (plans[date]?.items ?? []).some((it) => isSpecial(it, everyday));
    if (!hasSpecial) {
      entries.push({
        key: `gap-${date}`,
        when: WEEKDAYS[weekday],
        date,
        title: 'Open',
        kind: 'gap',
      });
      break; // one gap invitation at a time
    }
  }

  return entries;
}

/**
 * Weekly check: does the user have anything to look forward to? Returns at
 * most one suggestion, only when the next 7 days hold no enjoyable moment.
 */
export function detectAnticipationGap(
  today: string,
  plans: Record<string, DailyPlan>,
  routines: Routine[],
  profile: LifeProfile,
): Suggestion | null {
  const everyday = new Set(routines.filter((r) => r.days.length >= 6).map((r) => r.id));
  for (let i = 0; i <= 6; i++) {
    const items = plans[addDays(today, i)]?.items ?? [];
    if (items.some((it) => isSpecial(it, everyday))) return null;
  }

  // Find the first open weekend morning to attach the idea to.
  let targetDate = '';
  for (let i = 1; i <= 8; i++) {
    const date = addDays(today, i);
    const weekday = weekdayOf(date);
    if (weekday === 6 || weekday === 0) {
      targetDate = date;
      break;
    }
  }
  if (!targetDate) return null;

  const idea = ideasFor(profile)[0];
  const weekdayName = WEEKDAYS[dateKeyToDate(targetDate).getDay()];
  return {
    id: newId('sug'),
    kind: 'connection',
    // Opening on the absence contradicted the rest of the sentence — it
    // announced there was nothing to look forward to and then named
    // something to look forward to — and led with a deficit besides. The
    // open morning IS the good news; say that and stop.
    message: `${weekdayName} morning is wide open — ${idea.toLowerCase()}?`,
    reason:
      'A good week needs more than obligations done well. You said this matters; the time exists.',
    payload: {
      date: targetDate,
      start: '09:30',
      durationMin: 120,
      title: idea,
      area: 'enjoyment',
    },
    confidence: 0.6,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}
