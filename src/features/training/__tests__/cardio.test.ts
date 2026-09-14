/**
 * "Logging a jog or row or non-weights activity."
 *
 * The two numbers that make cardio worth logging are how far and how hard.
 * These pin what each buys — pace only where pace means something, and the
 * published activity table's double credit for vigorous work — and the
 * refusals: no heart-rate zones, no calories.
 */

import {
  CARDIO_ACTIVITIES,
  EFFORT_DESCRIPTION,
  cardioObservations,
  cardioSummary,
  cardioWeek,
  isVigorous,
  moderateEquivalentMinutes,
  paceLine,
  type CardioLog,
} from '@/features/training/cardio';

function log(over: Partial<CardioLog> = {}): CardioLog {
  return {
    id: 'c1',
    date: '2026-09-14',
    activity: 'run',
    durationMin: 30,
    effort: 'steady',
    createdAt: '2026-09-14T08:00:00.000Z',
    ...over,
  };
}

describe('the activity list', () => {
  it('includes walking, and does not rank it below running', () => {
    // The most-done physical activity in the country, and the one fitness
    // apps most often leave out.
    const walk = CARDIO_ACTIVITIES.find((a) => a.id === 'walk');
    expect(walk).toBeTruthy();
    expect(CARDIO_ACTIVITIES[0].id).toBe('walk');
  });

  it('gives every activity a distance rule and an impact rule', () => {
    for (const a of CARDIO_ACTIVITIES) {
      expect(['km', 'none']).toContain(a.unit);
      expect(typeof a.lowImpact).toBe('boolean');
      // Pace only makes sense where there is a distance.
      if (a.pace) expect(a.unit).toBe('km');
    }
  });
});

describe('pace', () => {
  it('works out minutes per kilometre for a run', () => {
    expect(paceLine(log({ durationMin: 28, distanceKm: 5.2 }))).toBe('5:23 /km');
  });

  it('pads the seconds', () => {
    expect(paceLine(log({ durationMin: 30, distanceKm: 6 }))).toBe('5:00 /km');
  });

  it('refuses to compute pace for a ride or a walk', () => {
    // Pace on a ride is a statement about the hills and the wind. Showing
    // it invites somebody to read a headwind as having got worse.
    expect(paceLine(log({ activity: 'ride', durationMin: 60, distanceKm: 25 }))).toBeNull();
    expect(paceLine(log({ activity: 'walk', durationMin: 60, distanceKm: 5 }))).toBeNull();
  });

  it('returns nothing where no distance was given', () => {
    expect(paceLine(log())).toBeNull();
    expect(paceLine(log({ distanceKm: 0 }))).toBeNull();
  });
});

describe('effort', () => {
  it('describes every effort with the talk test rather than a heart rate', () => {
    // A percentage of max heart rate needs a measured max, and 220-minus-age
    // is out by about ten beats either way. Precision we do not have.
    for (const description of Object.values(EFFORT_DESCRIPTION)) {
      expect(description).not.toMatch(/\d/);
      expect(description).not.toMatch(/zone|bpm|heart rate/i);
    }
  });

  it('counts hard and all-out as vigorous, easy and steady as moderate', () => {
    expect(isVigorous('easy')).toBe(false);
    expect(isVigorous('steady')).toBe(false);
    expect(isVigorous('hard')).toBe(true);
    expect(isVigorous('allOut')).toBe(true);
  });

  it('pays vigorous minutes double, as the published table does', () => {
    expect(moderateEquivalentMinutes(30, 'steady')).toBe(30);
    expect(moderateEquivalentMinutes(30, 'hard')).toBe(60);
  });
});

describe('what a log writes into the metric stream', () => {
  it('always records minutes', () => {
    const out = cardioObservations(log());
    expect(out[0].key).toBe('cardio.minutes');
    expect(out[0].value).toBe(30);
  });

  it('keys distance and pace per activity, never shared', () => {
    // A 5:00/km run and a rowing pace on one chart is a line that means
    // nothing and reads as progress.
    const run = cardioObservations(log({ activity: 'run', durationMin: 30, distanceKm: 6 }));
    const row = cardioObservations(log({ activity: 'row', durationMin: 30, distanceKm: 7 }));
    expect(run.map((o) => o.key)).toContain('cardio.run.km');
    expect(run.map((o) => o.key)).toContain('cardio.run.paceSecPerKm');
    expect(row.map((o) => o.key)).toContain('cardio.row.km');
    expect(run.map((o) => o.key)).not.toContain('cardio.row.km');
  });

  it('records no distance for an activity that has none', () => {
    const out = cardioObservations(log({ activity: 'class', distanceKm: 5 }));
    expect(out).toHaveLength(1);
  });

  it('records distance but no pace for a ride', () => {
    const out = cardioObservations(log({ activity: 'ride', durationMin: 60, distanceKm: 25 }));
    expect(out.map((o) => o.key)).toEqual(['cardio.minutes', 'cardio.ride.km']);
  });

  it('never records a calorie figure', () => {
    // The app cannot know them to better than about 25%, and a wrong one
    // is worse than none for the people most likely to be counting.
    const out = cardioObservations(log({ distanceKm: 5 }));
    expect(out.map((o) => o.key).join(' ')).not.toMatch(/cal|kj|energy/i);
  });
});

describe('the summary line', () => {
  it('reads as a person would say it', () => {
    expect(cardioSummary(log({ durationMin: 28, distanceKm: 5.2, effort: 'hard' }))).toBe(
      'Run · 5.2 km in 28 min · 5:23 /km · Hard',
    );
  });

  it('leaves the distance out where there was none', () => {
    expect(cardioSummary(log({ activity: 'class', durationMin: 45 }))).toBe('Class · 45 min · Steady');
  });
});

describe('the week', () => {
  const logs = [
    log({ id: 'a', date: '2026-09-09', durationMin: 30, effort: 'easy', distanceKm: 4 }),
    log({ id: 'b', date: '2026-09-12', durationMin: 25, effort: 'hard', distanceKm: 5 }),
    log({ id: 'c', date: '2026-09-01', durationMin: 60, effort: 'hard' }),
  ];

  it('counts only the week, and doubles the vigorous minutes', () => {
    const out = cardioWeek(logs, '2026-09-08', '2026-09-14');
    expect(out?.sessions).toBe(2);
    expect(out?.minutes).toBe(55);
    expect(out?.moderateEquivalent).toBe(80); // 30 easy + 25 hard doubled
    expect(out?.km).toBe(9);
  });

  it('returns nothing for a week with no logs rather than a zero', () => {
    // No logs is unmeasured, not sedentary.
    expect(cardioWeek(logs, '2026-08-01', '2026-08-07')).toBeNull();
  });
});
