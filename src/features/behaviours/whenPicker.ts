/**
 * When did it happen — for a person who is not holding the phone at the time.
 *
 * The log screen used to offer five choices, all inside the last three
 * hours: just now, and then thirty minutes to three hours back. That is the
 * shape of a log kept in the moment, and the header of `BehaviourLog` says
 * in as many words that people do not keep one — "People reach for the app
 * after the moment, not during it." The picker contradicted the comment
 * above it, so a person who drank on Tuesday and opened the app on Thursday
 * had no way to say so, and the pattern engine never heard about Tuesday.
 *
 * Two kinds of answer, because people have two kinds of memory about this:
 *
 *   Recent    an actual clock time — "an hour ago" — which someone can
 *             genuinely place, and which is exact.
 *   Earlier   a part of the day — "Tuesday evening" — which is what memory
 *             actually retains once a day has passed.
 *
 * A part of the day is stored as the middle of that stretch. That is an
 * approximation and it is labelled as one on the way in: the chip says
 * "Evening", never "8:00 pm", so nobody is shown a precision they did not
 * give. The alternative was to keep refusing the entry, and a rough Tuesday
 * is worth far more to the pattern engine than a missing one.
 */

export interface DayChoice {
  /** Days back from today. 0 is today. */
  offsetDays: number;
  label: string;
}

export interface TimeChoice {
  key: string;
  label: string;
  /** Minutes from midnight the entry is stored at. */
  minuteOfDay: number;
  /** True where the minute is the middle of a stretch, not a stated time. */
  approximate: boolean;
}

/** How far back the picker goes. A fortnight is past useful recall. */
export const DAYS_BACK = 7;

/** Offsets in minutes for something that happened within the last few hours. */
const RECENT_OFFSETS = [0, 30, 60, 120, 180];

/**
 * The parts of a day, and the minute each is stored at.
 *
 * The boundaries are the ones people use rather than clock quarters: the
 * evening starts when the day is done, and "late" is its own thing because
 * for several of the behaviours in the catalogue it is the whole pattern.
 */
export const PARTS_OF_DAY: TimeChoice[] = [
  { key: 'morning', label: 'Morning', minuteOfDay: 9 * 60, approximate: true },
  { key: 'afternoon', label: 'Afternoon', minuteOfDay: 15 * 60, approximate: true },
  { key: 'evening', label: 'Evening', minuteOfDay: 20 * 60, approximate: true },
  { key: 'late', label: 'Late at night', minuteOfDay: 23 * 60, approximate: true },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Today, yesterday, then weekday names — how people say it. */
export function dayChoices(now: Date, daysBack = DAYS_BACK): DayChoice[] {
  const out: DayChoice[] = [];
  for (let offsetDays = 0; offsetDays < daysBack; offsetDays++) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - offsetDays);
    const label =
      offsetDays === 0 ? 'Today' : offsetDays === 1 ? 'Yesterday' : WEEKDAYS[d.getDay()];
    out.push({ offsetDays, label });
  }
  return out;
}

/**
 * The times worth offering for a chosen day.
 *
 * Today gets the exact recent offsets, plus any part of the day that is
 * already well behind — so somebody logging at nine at night can still say
 * "this morning" without the list repeating itself around the last three
 * hours. An earlier day gets the parts only, because nobody remembers the
 * clock time of a Tuesday.
 */
export function timeChoicesFor(offsetDays: number, now: Date): TimeChoice[] {
  if (offsetDays > 0) return PARTS_OF_DAY;

  const minuteNow = now.getHours() * 60 + now.getMinutes();
  const recent: TimeChoice[] = RECENT_OFFSETS.filter((o) => minuteNow - o >= 0).map((o) => {
    const m = minuteNow - o;
    return {
      key: `recent-${o}`,
      label: o === 0 ? 'Just now' : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
      minuteOfDay: m,
      approximate: false,
    };
  });

  // Only the stretches that have finished, and only where they do not sit
  // inside the exact choices above — two chips for the same half hour is
  // a picker arguing with itself.
  const earlier = PARTS_OF_DAY.filter((p) => p.minuteOfDay < minuteNow - 180);
  return [...recent, ...earlier];
}

/** The timestamp to store, never in the future. */
export function occurredAtFrom(now: Date, offsetDays: number, time: TimeChoice): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() - offsetDays);
  d.setHours(Math.floor(time.minuteOfDay / 60), time.minuteOfDay % 60, 0, 0);
  return (d.getTime() > now.getTime() ? now : d).toISOString();
}

/** What the screen says it is about to record, in the person's own terms. */
export function whenSummary(day: DayChoice, time: TimeChoice): string {
  if (day.offsetDays === 0 && !time.approximate) {
    return time.label === 'Just now' ? 'Just now' : `Today at ${time.label}`;
  }
  return `${day.label}, ${time.label.toLowerCase()}`;
}
