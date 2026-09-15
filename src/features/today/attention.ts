/**
 * One job, and one thing asking for it.
 *
 * ── What Today had become ───────────────────────────────────────────────
 *
 * Eleven things could render on this screen at once, all of them good on
 * their own, none of them aware of the others:
 *
 *   the Plus nudge · the week's momentum · the plan summary · "set up your
 *   day" · the week/month ritual · the readiness card · the welcome-back
 *   card · the commitment budget · a trial whose fortnight is up · a
 *   check-in that is due · a suggestion · the coach note · the locked
 *   sessions · "earlier today" · a 56-chip habit wall
 *
 * Each was added for a real reason and each says so in its own file. The
 * failure is emergent: every one of them is silent most days, so nobody
 * building one ever saw four of them fire together — and on the morning
 * they do, the screen answers "what now?" fifth.
 *
 * The screen has ONE job: what to do now. Everything above is an
 * interruption, and interruptions need an arbiter.
 *
 * ── The rule ────────────────────────────────────────────────────────────
 *
 * **At most one, ever.** The same rule `features/coaches/interrupt.ts`
 * applies to coaches, for the same reason: a second thing asking is not
 * twice as useful, it is the first one becoming wallpaper. Nothing here is
 * dismissed or lost — it is not shown TODAY, and it will claim the slot on
 * a day when nothing above it does.
 *
 * ── Why this order ──────────────────────────────────────────────────────
 *
 * Roughly: time-critical before routine, and "the app doing its job"
 * before "the app asking for something".
 *
 * `welcomeBack` leads because somebody returning after a gap is the moment
 * with the least room for noise — everything else is a stranger talking
 * over a reunion. Then the day is set up, then anything that changes what
 * TODAY should be (readiness), then anything at a turn (the week or month
 * ritual, a trial's fortnight), then measurement, then what the app is
 * holding back, then what it proposes.
 *
 * The Plus nudge sits mid-table rather than first, which is where it used
 * to render — above everything, on every screen, before the app had shown
 * it could do the job. It is a one-time, dismissible card, so mid-table
 * still means it gets seen; it simply no longer talks over a person coming
 * back after a fortnight away. An app asking for money before it has
 * answered "what now?" has the order wrong.
 *
 * ── What is deliberately NOT arbitrated ─────────────────────────────────
 *
 * A coach interruption, which takes the whole screen and is arbitrated
 * among itself already (`coaches/interrupt.ts`). It outranks this list by
 * construction: it is a different screen.
 *
 * The move note. That is the app ANSWERING something the person just did,
 * not asking them for anything, and feedback on your own action is not an
 * interruption.
 *
 * Tonight's urge interventions. Those are the reason somebody opens the
 * app at the hour they fire, and "we never charge for someone's hardest
 * moment" has a scheduling corollary: we never queue it behind a
 * check-in either.
 */

export type AttentionId =
  | 'welcomeBack'
  | 'setupDay'
  | 'readiness'
  | 'ritual'
  | 'trial'
  | 'checkin'
  | 'plus'
  | 'budget'
  | 'suggestion';

/** First match wins. Nothing below the winner renders today. */
export const ATTENTION_ORDER: AttentionId[] = [
  'welcomeBack',
  'setupDay',
  'readiness',
  'ritual',
  'trial',
  'checkin',
  'plus',
  'budget',
  'suggestion',
];

export type AttentionAvailable = Partial<Record<AttentionId, boolean>>;

/**
 * The one thing Today is allowed to ask for.
 *
 * Returns null on the ordinary day, which is most days and is the point:
 * a screen that always has something to say is a screen nobody reads.
 */
export function claimAttention(available: AttentionAvailable): AttentionId | null {
  return ATTENTION_ORDER.find((id) => available[id] === true) ?? null;
}

/** Whether a given block may render. Reads as the gate it is. */
export function shows(claimed: AttentionId | null, id: AttentionId): boolean {
  return claimed === id;
}

/**
 * How many were waiting behind the winner.
 *
 * Not shown as a badge or a count — the app does not tell somebody they
 * have nine notifications. It exists so the screen can say "there is more,
 * tomorrow" once, in a caption, rather than silently swallowing things and
 * leaving a person who half-remembers a card wondering where it went.
 */
export function waiting(available: AttentionAvailable): number {
  return ATTENTION_ORDER.filter((id) => available[id] === true).length - 1;
}
