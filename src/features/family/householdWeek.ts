/**
 * The household week: who has what, and a message the other person reads.
 *
 * The hub used to show one flat list of every shared item and copy it out
 * as bullet points ending in a product credit. Nobody could tell from it
 * whether Thursday was the two of them, all of them, or one child's turn —
 * which is the one thing a partner reading it wants to know. Cozi answers
 * that with a colour per person; this answers it with a word.
 *
 * Local-first, like the rest of the household layer. Nothing here leaves
 * the phone unless the person sends it.
 */

import { addDays, dateKeyToDate, formatTime } from '@/lib/dates';
import type { DailyPlan, LifeProfile, Routine } from '@/types/domain';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Who an entry is for. */
export type Who = 'two' | 'all' | 'one' | 'you';

export interface WeekEntry {
  date: string;
  /** "Today" or the weekday name. */
  when: string;
  start: string;
  title: string;
  who: Who;
}

const SHARED_AREAS = new Set(['relationship', 'family', 'enjoyment']);
/** The carer's own time: on the hub so it is seen, marked as theirs. */
const OWN_PROTOCOLS = new Set(['carer-own-hours', 'carer-ten-minutes']);
const ONE_AT_A_TIME = /one-on-one|their pick|side by side|the drive, the dog|standing call|one decision that is theirs/i;
const TWO_OF_YOU = /date night|the two of you|check-in|state of us|neither of you|for [A-Z]/;

function whoFor(title: string, area: string, protocolId: string | undefined): Who {
  if (protocolId && OWN_PROTOCOLS.has(protocolId)) return 'you';
  if (ONE_AT_A_TIME.test(title)) return 'one';
  if (area === 'relationship' || TWO_OF_YOU.test(title)) return 'two';
  return 'all';
}

/**
 * The next seven days' shared moments, each saying who it is for.
 * Everyday anchors (dinner every night) stay off: a partner does not need
 * telling that dinner is at six.
 */
export function householdWeek(
  today: string,
  plans: Record<string, DailyPlan>,
  routines: Routine[],
): WeekEntry[] {
  const byId = new Map(routines.map((r) => [r.id, r]));
  const entries: WeekEntry[] = [];
  for (let i = 0; i <= 6; i++) {
    const date = addDays(today, i);
    for (const item of plans[date]?.items ?? []) {
      if (item.status !== 'planned' || item.fixed) continue;
      const routine = item.routineId ? byId.get(item.routineId) : undefined;
      const own = routine?.protocolId !== undefined && OWN_PROTOCOLS.has(routine.protocolId);
      if (!own && !SHARED_AREAS.has(item.area)) continue;
      if (routine && routine.days.length >= 6 && !own) continue;
      entries.push({
        date,
        when: i === 0 ? 'Today' : WEEKDAYS[dateKeyToDate(date).getDay()],
        start: item.start,
        title: item.title,
        who: whoFor(item.title, item.area, routine?.protocolId),
      });
    }
  }
  return entries;
}

export interface WhoGroup {
  who: Who;
  label: string;
  entries: WeekEntry[];
}

/** The week grouped by who it is for, in the order a partner reads it. */
export function whoHasWhat(entries: WeekEntry[], partnerName?: string): WhoGroup[] {
  const labels: Record<Who, string> = {
    two: partnerName ? `You and ${partnerName}` : 'The two of you',
    all: 'Everyone',
    one: 'One at a time',
    you: 'Yours alone',
  };
  const order: Who[] = ['you', 'two', 'one', 'all'];
  return order
    .map((who) => ({ who, label: labels[who], entries: entries.filter((e) => e.who === who) }))
    .filter((g) => g.entries.length > 0);
}

const WHO_TAG: Record<Who, string> = {
  two: 'us',
  all: 'all of us',
  one: 'one-on-one',
  you: 'me',
};

/**
 * The week as a message.
 *
 * Grouped by day, one line each, who it is for in brackets, and a question
 * at the end so it reads as a message rather than a notice. Signed with
 * the sender's name, not the product's: it is going to their partner.
 */
export function householdShareText(profile: LifeProfile, entries: WeekEntry[]): string {
  const partner = profile.people.find((p) => p.relation === 'partner')?.name;
  const opener = partner ? `This week, ${partner}:` : 'This week:';
  if (entries.length === 0) {
    return `${opener}\nNothing shared yet — what should we put in?\n\n${profile.firstName}`;
  }
  const lines = entries.map((e) => {
    const day = e.when === 'Today' ? 'Today' : SHORT_DAYS[dateKeyToDate(e.date).getDay()];
    return `${day} ${formatTime(e.start)} — ${e.title} (${WHO_TAG[e.who]})`;
  });
  return `${opener}\n${lines.join('\n')}\n\nAnything to move? Say so and I will shift it.\n\n${profile.firstName}`;
}

export function nextDateNight(entries: WeekEntry[]): WeekEntry | null {
  return entries.find((e) => /date night/i.test(e.title)) ?? null;
}
