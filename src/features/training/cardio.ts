/**
 * Logging a jog, a row, a ride — anything that is not a lift.
 *
 * Isaac: "logging a jog or row or non-weights activity."
 *
 * The app could already log that something happened (`LogDidIt` takes a
 * title, an area and a rough duration), and that is genuinely most of the
 * value. What it could not do is keep the two numbers that make cardio
 * worth logging at all: how far, and how hard. Without those, six months
 * of running is a list of the word "Run" and the app can tell you nothing
 * about it — not that your pace improved, not that your easy runs stopped
 * being easy.
 *
 * ── WHAT THIS RECORDS, AND WHAT IT REFUSES TO ───────────────────────────
 *
 * Duration, distance where the activity has one, and effort in four steps.
 * That is the whole instrument.
 *
 * Not heart rate zones. Zone models need a measured maximum heart rate,
 * almost nobody has one, and the 220-minus-age estimate everything else
 * uses has a standard deviation around ten beats either way — so a "Zone 2"
 * label computed from it can be a whole zone wrong. Effort by feel is less
 * precise-looking and more accurate. It is also the thing the research
 * itself mostly used: the talk test is in the guidelines because it works.
 *
 * Not calories. The app cannot know them to better than about 25% and a
 * wrong calorie figure is worse than no calorie figure, particularly for
 * the people most likely to be counting.
 *
 * ── HOW IT REACHES THE REST OF THE APP ──────────────────────────────────
 *
 * Every log writes into the same metric stream as everything else, so a
 * jog shows on the Data screen beside a bench press and feeds the
 * wellbeing overview's activity component. The published Life's Essential
 * 8 table pays vigorous minutes double; effort is what lets this honour
 * that rather than counting every minute the same.
 */

/** What the distance field means for an activity, when it means anything. */
export type CardioUnit = 'km' | 'none';

export interface CardioActivity {
  id: string;
  label: string;
  unit: CardioUnit;
  /** True where pace per kilometre is the number people think in. */
  pace: boolean;
  /** Low impact through the legs — offered first where joints are an issue. */
  lowImpact: boolean;
}

/**
 * Deliberately broad, deliberately unordered by worthiness.
 *
 * A brisk walk and a 10km run are both here and neither is presented as
 * the real one. Walking is the most-done physical activity in the country
 * and the one most often left out of fitness apps, which is a good way to
 * make somebody feel their week did not count.
 */
export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { id: 'walk', label: 'Walk', unit: 'km', pace: false, lowImpact: false },
  { id: 'jog', label: 'Jog', unit: 'km', pace: true, lowImpact: false },
  { id: 'run', label: 'Run', unit: 'km', pace: true, lowImpact: false },
  { id: 'row', label: 'Row', unit: 'km', pace: true, lowImpact: true },
  { id: 'ride', label: 'Ride', unit: 'km', pace: false, lowImpact: true },
  { id: 'swim', label: 'Swim', unit: 'km', pace: true, lowImpact: true },
  { id: 'hike', label: 'Hike', unit: 'km', pace: false, lowImpact: false },
  { id: 'elliptical', label: 'Cross-trainer', unit: 'none', pace: false, lowImpact: true },
  { id: 'stairs', label: 'Stairs', unit: 'none', pace: false, lowImpact: false },
  { id: 'intervals', label: 'Intervals', unit: 'none', pace: false, lowImpact: false },
  { id: 'class', label: 'Class', unit: 'none', pace: false, lowImpact: false },
  { id: 'sport', label: 'Sport', unit: 'none', pace: false, lowImpact: false },
  { id: 'other', label: 'Something else', unit: 'none', pace: false, lowImpact: false },
];

export function cardioActivity(id: string): CardioActivity | undefined {
  return CARDIO_ACTIVITIES.find((a) => a.id === id);
}

/**
 * Effort, in what a person can actually report afterwards.
 *
 * The descriptions are the talk test, which is in the physical activity
 * guidelines precisely because it needs no equipment and survives contact
 * with a real person on a real day.
 */
export type CardioEffort = 'easy' | 'steady' | 'hard' | 'allOut';

export const EFFORT_LABEL: Record<CardioEffort, string> = {
  easy: 'Easy',
  steady: 'Steady',
  hard: 'Hard',
  allOut: 'All out',
};

export const EFFORT_DESCRIPTION: Record<CardioEffort, string> = {
  easy: 'Could hold a conversation the whole way',
  steady: 'Could speak in sentences, but would rather not',
  hard: 'A few words at a time',
  allOut: 'Could not speak',
};

/**
 * Which efforts count as vigorous on the published activity table.
 *
 * Life's Essential 8 counts minutes of moderate activity, with vigorous
 * minutes worth double. Easy and steady are moderate; hard and all-out are
 * vigorous. A walk that leaves you able to chat is not half a run and the
 * table does not pretend it is — it is simply moderate, which is the
 * category that most of the mortality evidence actually sits in.
 */
export function isVigorous(effort: CardioEffort): boolean {
  return effort === 'hard' || effort === 'allOut';
}

/** Minutes as the activity table counts them: vigorous pays double. */
export function moderateEquivalentMinutes(durationMin: number, effort: CardioEffort): number {
  return isVigorous(effort) ? durationMin * 2 : durationMin;
}

export interface CardioLog {
  id: string;
  /** Date key of the session, not of the typing. */
  date: string;
  /** An id from CARDIO_ACTIVITIES. */
  activity: string;
  durationMin: number;
  /** Kilometres, where the activity has a distance and the person knew it. */
  distanceKm?: number;
  effort: CardioEffort;
  /** Whatever they want to say about it. Never parsed, never scored. */
  note?: string;
  /** The interval session this was, where it came from the HIIT library. */
  hiitId?: string;
  createdAt: string;
}

/** "Run · 5.2 km in 28 min · 5:23 /km · Hard" */
export function cardioSummary(log: CardioLog): string {
  const activity = cardioActivity(log.activity);
  const parts = [activity?.label ?? log.activity];
  parts.push(
    log.distanceKm
      ? `${trimNumber(log.distanceKm)} km in ${log.durationMin} min`
      : `${log.durationMin} min`,
  );
  const pace = paceLine(log);
  if (pace) parts.push(pace);
  parts.push(EFFORT_LABEL[log.effort]);
  return parts.join(' · ');
}

/**
 * Minutes per kilometre, only where the activity is one people pace.
 *
 * Deliberately absent for a walk, a ride and a hike. Pace on a ride is a
 * statement about the hills and the wind, not about the rider, and showing
 * it invites somebody to read a headwind as having got worse.
 */
export function paceLine(log: CardioLog): string | null {
  const activity = cardioActivity(log.activity);
  if (!activity?.pace || !log.distanceKm || log.distanceKm <= 0) return null;
  const secPerKm = Math.round((log.durationMin * 60) / log.distanceKm);
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

/**
 * The metric readings a log produces.
 *
 * Minutes always. Distance where there is one. Pace only for the paced
 * activities, and keyed per activity so a 5:00/km run and a 2:00/500m row
 * never land on one chart and make a nonsense of both.
 */
export function cardioObservations(log: CardioLog): { key: string; value: number; note?: string }[] {
  const out: { key: string; value: number; note?: string }[] = [
    { key: 'cardio.minutes', value: log.durationMin, note: cardioSummary(log) },
  ];
  const activity = cardioActivity(log.activity);
  if (activity?.unit === 'km' && log.distanceKm && log.distanceKm > 0) {
    out.push({ key: `cardio.${log.activity}.km`, value: log.distanceKm });
    if (activity.pace) {
      out.push({
        key: `cardio.${log.activity}.paceSecPerKm`,
        value: Math.round((log.durationMin * 60) / log.distanceKm),
      });
    }
  }
  return out;
}

/**
 * The week's cardio, counted the way the activity table counts it.
 *
 * Returns null rather than zero for a week with no logs, for the same
 * reason the wellbeing overview does: no logs is unmeasured, not sedentary.
 */
export function cardioWeek(
  logs: CardioLog[],
  from: string,
  to: string,
): { sessions: number; minutes: number; moderateEquivalent: number; km: number } | null {
  const inWeek = logs.filter((l) => l.date >= from && l.date <= to);
  if (inWeek.length === 0) return null;
  return {
    sessions: inWeek.length,
    minutes: inWeek.reduce((a, l) => a + l.durationMin, 0),
    moderateEquivalent: inWeek.reduce(
      (a, l) => a + moderateEquivalentMinutes(l.durationMin, l.effort),
      0,
    ),
    km: inWeek.reduce((a, l) => a + (l.distanceKm ?? 0), 0),
  };
}
