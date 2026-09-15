/**
 * How far a coach can reach when the app is closed.
 *
 * ── The one that matters ────────────────────────────────────────────────
 *
 * The family coach's whole product, from the review: *"The job is not more
 * family time. It is: stop the 17:50 collision when work runs over."* The
 * build it named is a 17:15 nudge — "Dinner in 45. Making it, or shall I
 * say 20 late?" — and two taps to send the message.
 *
 * Half of that now exists in-app (`coaches/interrupt.ts` fires the same
 * question inside the family window). The half that was missing is the
 * only half that matters at 17:15 on a Tuesday: **the person is not
 * looking at the app.** A coach that can only speak to somebody already
 * holding the phone is not defending an evening, it is describing one
 * afterwards.
 *
 * ── Why a local notification and not email ──────────────────────────────
 *
 * `useNotificationSync` is mounted, `plannedNotifications` computes a
 * queue, quiet hours are honoured and the daily cap is enforced. All of it
 * was built and none of the coaches used it. It costs nothing
 * architecturally: no server, no account, no address, and "nothing leaves
 * your phone" stays true — which is the product's clearest differentiator
 * and the line a tester said stopped them bouncing.
 *
 * Email is the deliberate v1.1 decision, with the privacy trade written
 * down in `docs/REDESIGN.md` rather than discovered.
 *
 * ── The message it can send for you ─────────────────────────────────────
 *
 * "Shall I say 20 late?" is the part that turns a reminder into help. The
 * app does not send anything itself — it composes the sentence and opens
 * the OS share sheet, so Messages, Mail and everything else the person has
 * is one tap away and nothing about their evening reaches a server.
 */

import { voiceFor } from '@/features/coaches/voices';
import { coachForArea } from '@/features/coaches/interrupt';
import type { PlannedNotification } from '@/features/notifications/schedule';
import { formatTime, toHHMM, toMinutes } from '@/lib/dates';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

/**
 * How long before the block the coach speaks.
 *
 * Forty-five minutes is the review's own number and it is the right one:
 * long enough that the evening can still be saved, short enough that the
 * answer is about tonight rather than a guess about later.
 */
export const COACH_LEAD_MIN = 45;

/** The blocks a coach will defend out loud. */
const DEFENDED = new Set(['family', 'relationship']);

/**
 * The items worth defending today, in order.
 *
 * Fixed calendar events are excluded for the same reason every review
 * excludes them: they are the person's own diary, and the app did not put
 * them there.
 */
export function defendedItems(plan: DailyPlan | null | undefined): PlanItem[] {
  return (plan?.items ?? [])
    .filter((i) => !i.fixed && i.status === 'planned' && DEFENDED.has(i.area))
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/**
 * What the coach says out of the app, for one day.
 *
 * Deliberately one per day at most. The daily cap in `schedule.ts` would
 * enforce a ceiling anyway, but three notifications about three family
 * blocks is a coach that has become a calendar alert, and the first one is
 * the one that decides the evening.
 */
export function coachNotifications(input: {
  date: string;
  plan: DailyPlan | null | undefined;
  profile: LifeProfile | null;
}): PlannedNotification[] {
  const item = defendedItems(input.plan)[0];
  if (!item) return [];

  const at = toMinutes(item.start) - COACH_LEAD_MIN;
  // A block early enough that the lead time lands yesterday is a block
  // nobody needs defending from work running over.
  if (at < 0) return [];

  const voice = voiceFor(coachForArea(item.area));
  return [
    {
      id: `coach:${item.id}`,
      kind: 'coach',
      at: toHHMM(at),
      date: input.date,
      title: voice.name,
      body: `${item.title} in ${COACH_LEAD_MIN} minutes. Making it, or shall I move it?`,
    },
  ];
}

/* ── The message it writes for you ────────────────────────────────────── */

/** How late the coach offers to say you will be. Matches the interrupt. */
export const LATE_MINUTES = 20;

/**
 * The sentence, ready to send.
 *
 * Written in the first person and in the person's own voice rather than
 * the app's, because it is going to somebody who did not install this and
 * should never be able to tell that software was involved. No app name, no
 * sign-off, nothing that reads as automated.
 */
export function latenessMessage(item: PlanItem, minutes = LATE_MINUTES): string {
  const newStart = toHHMM(toMinutes(item.start) + minutes);
  return `Running about ${minutes} minutes late — see you at ${formatTime(newStart)}.`;
}

/** The label on the button that opens the share sheet. */
export const TELL_THEM = 'Tell them';
