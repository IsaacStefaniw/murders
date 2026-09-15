import { readFileSync } from 'fs';
import { join } from 'path';

import { asksFor } from '@/features/health/dailyAsk';
import { ATTENTION_ORDER } from '@/features/today/attention';
import { sleepRegularityIndex } from '@/features/health/sleepTiming';

/**
 * The question loop, and the reading nobody could give.
 *
 * `dailyAsk.ts` decided what was worth asking and how often, and no screen
 * ever called it. That is an unwired module. The consequence underneath is
 * sharper: sleep REGULARITY is the strongest sleep predictor in the
 * instrument — Windred and colleagues beat duration with it across 60,977
 * people — `sleepTiming.ts` computes it, `pace.ts` scores it, and
 * `recordSleepNight` sits in the store. Nothing called that either, so
 * there was no way for anybody without a watch to enter a bed time and the
 * component could never populate.
 */

const TODAY = '2026-09-15';
const base = {
  today: TODAY,
  nightsRecorded: [] as string[],
  activeHabits: [] as string[],
  hasStandingHabit: false,
  metrics: [],
};

describe('what it asks', () => {
  it('asks for the night it does not have', () => {
    expect(asksFor(base).map((a) => a.id)).toContain('sleepTiming');
    expect(asksFor({ ...base, nightsRecorded: [TODAY] }).map((a) => a.id)).not.toContain(
      'sleepTiming',
    );
  });

  it('asks about habits only while somebody has one running', () => {
    expect(asksFor(base).map((a) => a.id)).not.toContain('habits');
    expect(asksFor({ ...base, hasStandingHabit: true }).map((a) => a.id)).toContain('habits');
  });

  it('asks about health in general about once a month', () => {
    expect(asksFor({ ...base, lastSelfRatedHealth: '2026-09-10' }).map((a) => a.id)).not.toContain(
      'selfRatedHealth',
    );
    expect(asksFor({ ...base, lastSelfRatedHealth: '2026-07-01' }).map((a) => a.id)).toContain(
      'selfRatedHealth',
    );
  });

  /**
   * "Usually nothing" is the design working. A person with Health
   * connected and no habit running should be asked roughly never.
   */
  it('has nothing to say to somebody whose watch already answered', () => {
    expect(
      asksFor({ ...base, nightsRecorded: [TODAY], lastSelfRatedHealth: TODAY }),
    ).toEqual([]);
  });
});

describe('the screen', () => {
  const card = readFileSync(join(process.cwd(), 'src/features/health/DailyAsk.tsx'), 'utf8');
  const today = readFileSync(join(process.cwd(), 'src/app/(tabs)/today.tsx'), 'utf8');

  it('is reachable, and gated by the arbiter like everything else', () => {
    expect(today).toContain('<DailyAsk');
    expect(today).toContain("shows(claimed, 'dailyAsk')");
    expect(ATTENTION_ORDER).toContain('dailyAsk');
  });

  it('actually records a night, which nothing did before', () => {
    expect(card).toContain('recordSleepNight');
  });

  /**
   * Two clock times have to be easier to give than to skip. A numeric
   * field at seven in the morning is four taps and a mistyped colon.
   */
  it('takes the two times as taps, centred on their own window', () => {
    expect(card).toContain('profile.sleepTime');
    expect(card).toContain('profile.wakeTime');
    expect(card).not.toContain('keyboardType');
  });
});

describe('the component this turns on', () => {
  /**
   * Two people can average the same duration with identical variability
   * while one sleeps eleven-to-seven every night and the other alternates
   * ten-to-six and one-to-nine. Duration cannot see the difference; this
   * is what the bed times are for.
   */
  it('separates a steady sleeper from a scattered one, where duration cannot', () => {
    const steady = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      bedMin: 23 * 60,
      wakeMin: 7 * 60,
    }));
    const scattered = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, '0')}`,
      bedMin: i % 2 === 0 ? 22 * 60 : 1 * 60,
      wakeMin: i % 2 === 0 ? 6 * 60 : 9 * 60,
    }));
    const a = sleepRegularityIndex(steady, '2026-09-14')?.sri ?? null;
    const b = sleepRegularityIndex(scattered, '2026-09-14')?.sri ?? null;
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!).toBeGreaterThan(b!);
    // And both slept the same eight hours a night on average.
    const hours = (n: { bedMin: number; wakeMin: number }[]) =>
      n.reduce((t, x) => t + (x.wakeMin > x.bedMin ? x.wakeMin - x.bedMin : 1440 - x.bedMin + x.wakeMin), 0) /
      n.length /
      60;
    expect(Math.round(hours(steady))).toBe(Math.round(hours(scattered)));
  });
});
