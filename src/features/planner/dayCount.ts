import type { PlanItem } from '@/types/domain';

export interface DayCount {
  /** Things the day is asking of this person. */
  forYou: number;
  /** Things already committed — work, appointments, anything fixed. */
  booked: number;
}

export function dayCount(items: PlanItem[]): DayCount {
  let forYou = 0;
  let booked = 0;
  for (const item of items) {
    if (item.fixed) booked += 1;
    else forYou += 1;
  }
  return { forYou, booked };
}

/**
 * What a day asks of you, said in the two numbers that differ.
 *
 * The week used to read "15 planned" on a Tuesday. Fifteen is a number
 * that lands as fifteen obligations, and the review named it directly:
 * most of those fifteen are work blocks and appointments the person
 * already knew about and cannot move. The app had counted its own
 * calendar rather than the person's day.
 *
 * So the fixed things are counted separately and named as what they are.
 * Three for you and twelve booked is a manageable Tuesday; "15 planned"
 * is a reason to close the app.
 */
export function dayCountLine(items: PlanItem[]): string {
  const { forYou, booked } = dayCount(items);
  if (forYou === 0 && booked === 0) return 'Open';
  const yours = forYou === 0 ? 'nothing for you' : `${forYou} for you`;
  return booked === 0 ? yours : `${yours} · ${booked} booked`;
}
