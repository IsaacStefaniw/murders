/**
 * Who INTENT is for, expressed as something the app can act on.
 *
 * ── Why "week shape" and not "persona" ──────────────────────────────────
 *
 * A persona is a marketing object: a name, an age, a photograph, a set of
 * aspirations. It cannot be asked in one tap and it cannot be branched on,
 * because two people with the same persona can have completely different
 * weeks, and two people with completely different personas — a night-shift
 * nurse and a founder who works until 2am — can need the same scheduling
 * behaviour.
 *
 * What actually changes the app's behaviour is narrower: does this person
 * have working hours, are those hours theirs to set, and is their time
 * their own. Everything else the app needs (capacity, constraints, what
 * they care about) is already asked separately. So the segments below are
 * defined by the shape of the week, which is one question, and each one
 * names the market it serves rather than the other way round.
 *
 * ── The seven markets ───────────────────────────────────────────────────
 *
 *   employed      Employed professional. Fixed hours, most weeks alike.
 *                 The plan's job is to own the edges of the day.
 *
 *   selfDirected  Founder, executive, freelancer. Hours are theirs, which
 *                 is the problem: without a plan, work expands to fill
 *                 everything. The case INTENT was originally built for,
 *                 and the reason everything else fitted badly.
 *
 *   shift         Nurses, trades, hospitality, emergency services, FIFO.
 *                 The week does not repeat. A fixed wake time and a single
 *                 pair of work hours cannot describe them, so they are
 *                 asked for their usual shift and told plainly that the
 *                 plan follows the roster rather than the other way round.
 *
 *   study         Students and early career. Timetabled blocks, casual
 *                 work, little money and a lot of unstructured time — the
 *                 opposite failure mode to the operator.
 *
 *   caring        At home with children, or caring for a parent or
 *                 partner. Their hours are real work and are blocked as
 *                 such; what they do not have is control over when the
 *                 interruptions land, so the plan leans flexible.
 *
 *   retired       Retired, or not working right now. The structural
 *                 opposite of every other segment: the problem is not too
 *                 little time but too little shape. Nothing should be
 *                 defended from work, because there is no work; the week
 *                 is built out of what the person already has in it.
 *
 * A seventh market — the REBUILDER, coming back from illness, burnout,
 * divorce or redundancy — is deliberately NOT a week shape. It cuts across
 * all six, and it is already expressed by `capacity: 'minimal'` plus the
 * constraints answer. Making it a shape would force someone to choose
 * between describing their week and describing their situation.
 */

export type WeekShape =
  | 'employed'
  | 'selfDirected'
  | 'shift'
  | 'study'
  | 'caring'
  | 'retired';

export const WEEK_SHAPES: WeekShape[] = [
  'employed',
  'selfDirected',
  'shift',
  'study',
  'caring',
  'retired',
];

/**
 * Does this person have hours that belong in the calendar as committed
 * time? True for caring — looking after a parent or a toddler is not
 * leisure, and a plan that schedules a deep-work block over it is wrong in
 * exactly the way a plan that schedules over a shift is wrong.
 */
export function worksSomewhere(shape: WeekShape | undefined): boolean {
  // Undefined means "not asked yet", not "no job". Reading it as no job
  // would skip the work questions for everybody before they had answered
  // anything, which is the same class of bug as inventing a job for the
  // people who genuinely have none — just pointed the other way.
  return shape !== 'retired';
}

/** Whether the week repeats predictably enough to plan a fixed one. */
export function hasRepeatingWeek(shape: WeekShape | undefined): boolean {
  return shape !== 'shift' && shape !== 'caring';
}

/** What to call the committed block on screen, in the person's own terms. */
export function committedBlockLabel(shape: WeekShape | undefined): string {
  switch (shape) {
    case 'study':
      return 'Study';
    case 'caring':
      return 'Caring';
    case 'shift':
      return 'Shift';
    case 'retired':
      return 'Committed';
    default:
      return 'Work';
  }
}

/**
 * Placeholder text for the one-ambition question.
 *
 * The old placeholder read "Grow the business to $2m · Save $50k · Run a
 * marathon · Write the book · Japan with the kids". Every example was a
 * founder in their forties. A placeholder is not decoration — it tells
 * people what kind of answer belongs here, and that one told a
 * seventy-year-old they were in the wrong app.
 */
export function ambitionPlaceholder(shape: WeekShape | undefined): string {
  switch (shape) {
    case 'retired':
      return 'e.g. Walk the Larapinta · See the grandkids every month · Get the garden back · Learn the piano';
    case 'study':
      return 'e.g. Finish the degree well · Save a deposit · Get properly fit · Get a real portfolio together';
    case 'caring':
      return 'e.g. Two hours a week that are mine · Get back to running · Finish the course · A weekend away';
    case 'shift':
      return 'e.g. Sleep properly on nights · Get strong again · Clear the car loan · A proper holiday';
    case 'selfDirected':
      return 'e.g. Grow the business to $2m · Hire a number two · Fit at 50 · Japan with the kids';
    default:
      return 'e.g. Save $50k · Run a marathon · Move into a lead role · Write the book';
  }
}

/** Same problem, same fix, for the three-year picture. */
export function visionPlaceholder(shape: WeekShape | undefined): string {
  switch (shape) {
    case 'retired':
      return 'e.g. Still walking every day, close to the family, something of my own going on…';
    case 'study':
      return 'e.g. Qualified, out of debt, fit, and not living like a student…';
    case 'caring':
      return 'e.g. The kids settled, some time that is mine again, back to feeling like myself…';
    default:
      return 'e.g. Business runs without me, fit at 50, present with the kids…';
  }
}

/**
 * Things people want more of. The original list assumed kids, a partner
 * and a desk job; these add what the other five markets would look for
 * and drop what cannot apply.
 */
export function moreOfOptions(
  shape: WeekShape | undefined,
  hasKids: boolean,
): { value: string; label: string }[] {
  const base = [
    { value: 'Seeing friends', label: 'Seeing friends' },
    { value: 'Reading', label: 'Reading' },
    { value: 'Time outdoors', label: 'Time outdoors' },
    { value: 'Cooking real food', label: 'Cooking real food' },
    { value: 'Creative time', label: 'Creative time' },
    { value: 'Learning something', label: 'Learning something' },
    { value: 'Adventure & travel', label: 'Adventure & travel' },
  ];
  const kids = hasKids
    ? [{ value: 'Time with the kids', label: 'Time with the kids' }]
    : [];
  switch (shape) {
    case 'retired':
      return [
        ...kids,
        { value: 'Time with the grandchildren', label: 'Time with the grandchildren' },
        { value: 'Volunteering', label: 'Volunteering' },
        ...base,
        { value: 'Time in the garden', label: 'Time in the garden' },
      ];
    case 'caring':
      return [
        ...kids,
        { value: 'Time that is just mine', label: 'Time that is just mine' },
        { value: 'Date nights', label: 'Date nights' },
        ...base,
      ];
    case 'study':
      return [
        { value: 'Focused study', label: 'Focused study' },
        ...base,
        { value: 'Building something of my own', label: 'Building something of my own' },
      ];
    default:
      return [
        ...kids,
        { value: 'Date nights', label: 'Date nights' },
        ...base,
        { value: 'Deep work', label: 'Deep work' },
      ];
  }
}

/**
 * Money means something different at each end of a working life. The
 * original four options — weekly check-in, saving for something big,
 * getting out of debt, not yet — had nothing for a person on a fixed
 * income, which is most of the retired market.
 */
export function moneyOptions(
  shape: WeekShape | undefined,
): { value: string; label: string }[] {
  const none = { value: 'none', label: 'Not yet' };
  switch (shape) {
    case 'retired':
      return [
        { value: 'lasting', label: 'Making it last' },
        { value: 'checkin', label: 'A short monthly look at it' },
        { value: 'saving', label: "We're saving for something" },
        none,
      ];
    case 'study':
      return [
        { value: 'getting_on_top', label: 'Just getting on top of it' },
        { value: 'debt', label: 'Paying down what I owe' },
        { value: 'saving', label: 'Saving for something' },
        none,
      ];
    default:
      return [
        { value: 'checkin', label: 'A short weekly check-in' },
        { value: 'saving', label: "We're saving for something big" },
        { value: 'debt', label: 'Getting out of debt' },
        none,
      ];
  }
}
