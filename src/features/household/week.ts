/**
 * Household layer v1 — local-first.
 *
 * Real sync (shared calendars, partner accounts, babysitter messages that
 * send themselves) arrives with the backend. What works today, offline:
 * the week's shared moments in one place, a one-tap babysitter reminder
 * placed ahead of date night, and a copy-ready summary of the week to
 * text your partner — which is also how INTENT spreads: family first.
 */

import { addDays, dateKeyToDate, formatTime } from '@/lib/dates';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface TogetherEntry {
  date: string;
  when: string; // "Today" | weekday name
  start: string;
  title: string;
}

const TOGETHER_AREAS = new Set(['relationship', 'family', 'enjoyment']);

/** Shared moments over the next 7 days — everyday anchors (dinner) excluded. */
export function buildTogetherWeek(
  today: string,
  plans: Record<string, DailyPlan>,
  routines: Routine[],
): TogetherEntry[] {
  const everyday = new Set(routines.filter((r) => r.days.length >= 6).map((r) => r.id));
  const entries: TogetherEntry[] = [];
  for (let i = 0; i <= 6; i++) {
    const date = addDays(today, i);
    for (const item of plans[date]?.items ?? []) {
      if (item.status !== 'planned' || item.fixed) continue;
      if (!TOGETHER_AREAS.has(item.area)) continue;
      if (item.routineId && everyday.has(item.routineId)) continue;
      entries.push({
        date,
        when: i === 0 ? 'Today' : WEEKDAYS[dateKeyToDate(date).getDay()],
        start: item.start,
        title: item.title,
      });
    }
  }
  return entries;
}

/** The week as a message — ready to paste into any chat with your partner. */
export function shareWeekText(profile: LifeProfile, entries: TogetherEntry[]): string {
  const partner = profile.people.find((p) => p.relation === 'partner')?.name;
  const header = partner ? `Our week, ${partner}:` : 'Our week:';
  if (entries.length === 0) {
    return `${header}\nNothing on the shared calendar yet — pick something?\n\n— planned with INTENT`;
  }
  const lines = entries.map((e) => `• ${e.when} ${formatTime(e.start)} — ${e.title}`);
  return `${header}\n${lines.join('\n')}\n\n— planned with INTENT`;
}

export function nextDateNight(entries: TogetherEntry[]): TogetherEntry | null {
  return entries.find((e) => e.title.toLowerCase().includes('date night')) ?? null;
}

/** Best day to sort the babysitter: two days ahead of date night, never past. */
export function babysitterReminderDate(today: string, dateNightDate: string): string {
  const candidate = addDays(dateNightDate, -2);
  return candidate < today ? today : candidate;
}
