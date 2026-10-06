/**
 * The worst sentence the product has said.
 *
 * A review run as the target persona — the one the app is being built for
 * — logged a drink at 21:50 and opened the end-of-day screen four minutes
 * later, specifically to be held to it. The screen said:
 *
 *     "Easy cardio, talking pace and The urge answer happened.
 *      The daily walk and Get into the best shape of … didn't."
 *
 * The drink is absent. Worse than absent: the protocol built to prevent it
 * is reported as Done, because its plan item had been ticked earlier in
 * the evening. The last thing the product said before bed was that the
 * urge answer had worked, ninety seconds after being told it had not.
 *
 * The cause was structural, not a slip. `dayRows` reads `plan.items` and
 * nothing else, so the day review could not have seen a behaviour event if
 * it tried. For somebody whose stated reason for being here is "hold me to
 * it", the one screen whose job is the truth about today was built unable
 * to see the thing they most wanted held.
 */

import { dayAlsoHeld } from '@/features/review/dayReview';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const DATE = '2026-10-06';

const intention = (id: string, behaviour: string): BehaviourIntention =>
  ({
    id,
    behaviour,
    intentionText: 'When the pull starts, I do the two-minute breath reset.',
    active: true,
    createdAt: '2026-08-01T08:00:00.000Z',
  }) as BehaviourIntention;

const at = (id: string, intentionId: string, time: string): BehaviourEvent => ({
  id,
  intentionId,
  occurredAt: `${DATE}T${time}:00`,
});

describe('the end of the day', () => {
  it('says the drink the person logged ninety seconds ago', () => {
    const line = dayAlsoHeld([at('e1', 'bi-1', '21:50')], [intention('bi-1', 'alcohol')], DATE);
    expect(line).toMatch(/alcohol/i);
  });

  it('counts them, rather than grading them', () => {
    const line = dayAlsoHeld(
      [at('e1', 'bi-1', '20:10'), at('e2', 'bi-1', '21:50'), at('e3', 'bi-1', '22:40')],
      [intention('bi-1', 'alcohol')],
      DATE,
    );
    expect(line).toMatch(/3/);
    // No verdict, no second person, no running total to beat. The
    // aftermath flow owns the response; this only refuses to omit.
    expect(line).not.toMatch(/again|still|only|failed|missed|streak|%/i);
    expect(line).not.toMatch(/\byou\b/i);
  });

  it('names more than one kind without becoming a list', () => {
    const line = dayAlsoHeld(
      [at('e1', 'bi-1', '21:50'), at('e2', 'bi-2', '23:30')],
      [intention('bi-1', 'alcohol'), intention('bi-2', 'doomscrolling')],
      DATE,
    );
    expect(line).toMatch(/and/);
  });

  it('says nothing at all on a day with nothing logged', () => {
    // Silence is the correct output. A line reading "none today" is a
    // scoreboard with a zero on it.
    expect(dayAlsoHeld([], [intention('bi-1', 'alcohol')], DATE)).toBeNull();
    expect(
      dayAlsoHeld([at('e1', 'bi-1', '21:50')], [intention('bi-1', 'alcohol')], '2026-10-07'),
    ).toBeNull();
  });

  it('ignores an event whose intention is gone', () => {
    expect(dayAlsoHeld([at('e1', 'missing', '21:50')], [], DATE)).toBeNull();
  });
});
