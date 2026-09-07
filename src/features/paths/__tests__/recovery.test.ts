/**
 * The Habits & urges pathway after the research pass: more than one
 * trigger, "help me pick" matched to the trigger, the if-then plan leading
 * the hub, the clinical line per behaviour, and rungs that run something.
 */

import { RECOVERY_QUESTIONS } from '@/features/knowledge/questionBank';
import { PATHS } from '@/features/paths/definitions';
import { ladderFor } from '@/features/paths/programme';
import { isAlwaysFreeRoutine } from '@/features/plus/entitlement';
import type { LifeProfile } from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 2,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: ['alcohol'],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('the intake', () => {
  it('reads from the question bank, and the trigger takes more than one answer', () => {
    expect(PATHS.recovery.questions).toBe(RECOVERY_QUESTIONS);
    const trigger = RECOVERY_QUESTIONS.find((q) => q.key === 'trigger')!;
    expect(trigger.multi).toBe(true);
    expect(RECOVERY_QUESTIONS.find((q) => q.key === 'replacement')!.multi).toBeUndefined();
  });
});

describe('the build', () => {
  it('leads with the first trigger named when several are', () => {
    const b = PATHS.recovery.build({ behaviour: 'alcohol', trigger: 'social,stress', replacement: 'walk' }, profile);
    expect(b.routines[0].preferredStart).toBe('17:30');
    expect(b.goal.milestones!.filter((m) => m.done)).toHaveLength(2);
  });

  it('"help me pick" is matched to the trigger rather than always the breath', () => {
    const answer = (trigger: string) =>
      PATHS.recovery.build({ behaviour: 'doomscrolling', trigger, replacement: 'unsure' }, profile).routines[0];
    expect(answer('boredom').title).toContain('one small job with your hands');
    expect(answer('social').title).toContain('message someone real');
    expect(answer('tired').title).toContain('make a drink, slowly');
    expect(answer('evening').title).toContain('read instead');
    expect(answer('stress').sessionType).toBe('breathe');
    expect(answer('unsure').sessionType).toBe('breathe');
  });

  it('every routine the pathway builds runs without Plus', () => {
    for (const level of ['foundation', 'developing', 'established', 'advanced']) {
      const b = PATHS.recovery.build({ behaviour: 'vaping', trigger: 'stress', replacement: 'walk', level }, profile);
      for (const r of b.routines) expect(isAlwaysFreeRoutine(r, b.goal.id)).toBe(true);
    }
  });
});

describe('the hub', () => {
  it('leads with the if-then plan, from the answers until the person writes one', () => {
    const fromPicks = PATHS.recovery.insights({ behaviour: 'alcohol', trigger: 'social', replacement: 'message' }, profile);
    expect(fromPicks[0]).toContain('When other people are doing it, I message someone who knows.');
    expect(fromPicks[0]).toContain('your own words');
    const own = PATHS.recovery.insights(
      { behaviour: 'alcohol', trigger: 'social', ifThenCue: 'the second round comes', ifThenAction: 'I order the soda and say I am driving' },
      profile,
    );
    expect(own[0]).toBe('Your plan: When the second round comes, I order the soda and say I am driving.');
  });

  it('answers each trigger named, not only the first', () => {
    const lines = PATHS.recovery.insights({ behaviour: 'alcohol', trigger: 'stress,social' }, profile);
    expect(lines.some((l) => l.startsWith('Stress is the trigger'))).toBe(true);
    expect(lines.some((l) => l.startsWith('Social triggers'))).toBe(true);
  });

  it('draws the clinical line per behaviour, with helplines named generically', () => {
    const vaping = PATHS.recovery.insights({ behaviour: 'vaping', trigger: 'stress' }, profile).join(' ');
    expect(vaping).toMatch(/quitline/);
    expect(vaping).toMatch(/nicotine replacement/);
    const gambling = PATHS.recovery.insights({ behaviour: 'gambling', trigger: 'boredom' }, profile).join(' ');
    expect(gambling).toMatch(/bank card/);
    expect(gambling).toMatch(/helpline/);
    expect(gambling).not.toMatch(/\d{4}/);
    const alcohol = PATHS.recovery.insights({ behaviour: 'alcohol', trigger: 'evening' }, profile).join(' ');
    expect(alcohol).toMatch(/shakes/);
    const scroll = PATHS.recovery.insights({ behaviour: 'doomscrolling', trigger: 'evening' }, profile).join(' ');
    expect(scroll).not.toMatch(/quitline|helpline/);
  });

  it('says how wins are kept and what a slip is', () => {
    const lines = PATHS.recovery.insights({ behaviour: 'sugar', trigger: 'tired' }, profile).join(' ');
    expect(lines).toMatch(/never reset/);
    expect(lines).toMatch(/one event/);
  });
});

describe('the rungs', () => {
  it('the foundation reset can be run, and the evening check is the urge log', () => {
    const developing = ladderFor('recovery', 'developing', profile, 'g1');
    const reset = developing.routines.find((r) => /Two-minute reset/.test(r.title))!;
    expect(reset.sessionType).toBe('breathe');
    const check = developing.routines.find((r) => /Evening check/.test(r.title))!;
    expect(check.protocolId).toBe('urge-log');
    expect(check.sessionType).toBe('journal');
    expect(check.ladderRung).toBe(true);
  });

  it('the weekly review is the if-then plan, and the ladder never doubles a practice', () => {
    const established = ladderFor('recovery', 'established', profile, 'g1');
    const review = established.routines.find((r) => /Weekly pattern review/.test(r.title))!;
    expect(review.protocolId).toBe('trigger-if-then');
    // One journal session per build: the evening check is it.
    expect(review.sessionType).toBeUndefined();
    expect(established.routines.filter((r) => r.sessionType === 'journal')).toHaveLength(1);
    const ids = established.routines.map((r) => r.protocolId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('a pathway build that already breathes gets no second reset, and one that reads does', () => {
    const breath = PATHS.recovery.build({ behaviour: 'vaping', trigger: 'stress', replacement: 'breathe', level: 'developing' }, profile);
    expect(breath.routines.filter((r) => r.sessionType === 'breathe')).toHaveLength(1);
    const read = PATHS.recovery.build({ behaviour: 'vaping', trigger: 'evening', replacement: 'read', level: 'developing' }, profile);
    expect(read.routines.filter((r) => r.sessionType === 'breathe')).toHaveLength(1);
    expect(read.routines.some((r) => r.protocolId === 'urge-log')).toBe(true);
  });
});
