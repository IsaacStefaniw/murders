/**
 * The two people coaches, one household at a time.
 *
 * The family pathway presumed kids (QA open item PW-O6) and the
 * relationship pathway presumed a partner. These pin what each household
 * gets instead: a carer's own recovery first, a teenager's coach that
 * speaks to teenagers, a grandparent's standing day, a couple's version of
 * adventure, and a friends build for someone with nobody right now.
 */

import { PATHS } from '@/features/paths/definitions';
import { LEVEL_ORDER } from '@/features/paths/level';
import type { LifeProfile } from '@/types/domain';

const base: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health', 'family', 'work'],
  people: [
    { id: 'p', name: 'Alex', relation: 'partner' },
    { id: 'k', name: 'The kids', relation: 'child' },
  ],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  kidsCount: 2,
  createdAt: '2026-01-05T08:00:00.000Z',
  updatedAt: '2026-01-05T08:00:00.000Z',
};
const partnerOnly: LifeProfile = { ...base, people: [base.people[0]], kidsCount: undefined };
const nobody: LifeProfile = { ...base, people: [], kidsCount: undefined };
const carer: LifeProfile = {
  ...nobody,
  weekShape: 'caring',
  people: [{ id: 'c', name: 'The person I care for', relation: 'family' }],
};

const protocols = (b: { routines: { protocolId?: string }[] }) =>
  b.routines.map((r) => r.protocolId).filter((x): x is string => Boolean(x));
const titles = (b: { routines: { title: string }[] }) => b.routines.map((r) => r.title);
const milestones = (b: { goal: { milestones?: { title: string }[] } }) => (b.goal.milestones ?? []).map((m) => m.title);

describe('family: who it is for', () => {
  it('PW-O6: a household with no kids never gets a kids’ practice or promise, at any level', () => {
    for (const level of LEVEL_ORDER) {
      const build = PATHS.family.build({ ages: 'none', others: 'nobody', blocker: 'work', goodWeekend: 'slow', level }, partnerOnly);
      expect(build.routines.length).toBeGreaterThan(0);
      for (const t of [...titles(build), ...milestones(build)]) expect(t).not.toMatch(/child|kids/i);
      expect(protocols(build)).toContain('partner-novelty');
      expect(protocols(build)).not.toContain('one-on-one-child');
    }
  });

  it('a couple gets the couple’s adventure; someone alone gets adventure with people in it', () => {
    const couple = PATHS.family.build({ ages: 'none', others: 'nobody', blocker: 'work' }, partnerOnly);
    const alone = PATHS.family.build({ ages: 'none', others: 'nobody', blocker: 'work' }, nobody);
    expect(protocols(couple)).toContain('partner-novelty');
    expect(protocols(alone)).toContain('standing-shared-activity');
    expect(protocols(alone)).not.toContain('partner-novelty');
  });

  it('a carer gets their own recovery first and no outing, whatever the rung says', () => {
    for (const level of LEVEL_ORDER) {
      const build = PATHS.family.build({ ages: 'none', others: 'parent', blocker: 'energy', goodWeekend: 'outdoors', level }, carer);
      expect(protocols(build).slice(0, 3)).toEqual(['carer-own-hours', 'carer-ask-for-cover', 'carer-ten-minutes']);
      for (const t of [...titles(build), ...milestones(build)]) expect(t).not.toMatch(/outing|adventure/i);
      // What they enjoy on a Saturday is still offered, as optional.
      const saturday = build.routines.find((r) => /outside together/.test(r.title));
      expect(saturday?.tier).toBe('could');
    }
    expect(PATHS.family.insights({ ages: 'none', others: 'parent', blocker: 'energy' }, carer)[0]).toMatch(/your own recovery comes first/i);
  });

  it('a carer of a parent who is also a stretched parent of small kids gets calm parenting, not outings', () => {
    const build = PATHS.family.build({ ages: 'under5', others: 'parent', blocker: 'stretched' }, base);
    expect(protocols(build)).toEqual(
      expect.arrayContaining(['carer-own-hours', 'family-ritual-anchor', 'parent-regulation-pause']),
    );
    expect(protocols(build)).not.toContain('family-adventure');
  });

  it('the profile alone is enough to make someone a carer when the intake is silent', () => {
    const build = PATHS.family.build({ blocker: 'work' }, carer);
    expect(protocols(build)[0]).toBe('carer-own-hours');
  });

  it('teenagers get side-by-side time and one decision a week, never the three-hour outing', () => {
    const teens = { ...base, kidsCount: undefined };
    for (const blocker of ['work', 'logistics', 'scattered', 'energy', 'stretched']) {
      const build = PATHS.family.build({ ages: 'teens', others: 'nobody', blocker }, teens);
      expect(protocols(build)).toContain('teen-side-by-side');
      expect(protocols(build)).not.toContain('family-adventure');
      expect(protocols(build)).not.toContain('one-on-one-child');
      // The developing rung's "one child, no phone" is the same idea and must not double up.
      expect(titles(PATHS.family.build({ ages: 'teens', others: 'nobody', blocker, level: 'developing' }, teens)).filter((t) => /one-on-one/i.test(t))).toEqual([]);
    }
    expect(protocols(PATHS.family.build({ ages: 'teens', others: 'nobody', blocker: 'work' }, teens))).toContain('teen-their-call');
    expect(protocols(PATHS.family.build({ ages: 'teens', others: 'nobody', blocker: 'stretched' }, teens))).toContain('parent-regulation-pause');
    expect(PATHS.family.insights({ ages: 'teens', others: 'nobody', blocker: 'work' }, teens)[0]).toMatch(/teenagers/i);
  });

  it('a teenager with a younger sibling keeps the young-kids build, sized to the youngest', () => {
    const build = PATHS.family.build({ ages: 'teens,under5', others: 'nobody', blocker: 'work' }, base);
    expect(protocols(build)).toContain('family-adventure');
    expect(build.routines.find((r) => r.protocolId === 'family-adventure')?.durationMin).toBe(90);
  });

  it('stretched thin with young kids: calm first, the minutes they lead, no outing', () => {
    const build = PATHS.family.build({ ages: 'primary', others: 'nobody', blocker: 'stretched' }, base);
    expect(protocols(build).slice(0, 2)).toEqual(['parent-regulation-pause', 'child-led-play']);
    expect(protocols(build)).not.toContain('family-adventure');
  });

  it('a grandparent gets a standing day with the grandchildren', () => {
    const build = PATHS.family.build({ ages: 'adult', others: 'grandkids', blocker: 'logistics' }, nobody);
    expect(titles(build)).toContain('The standing day with the grandchildren');
    expect(protocols(build)).toContain('adult-child-standing-call');
    expect(protocols(build)).not.toContain('one-on-one-child');
  });

  it('the old saved answers still build the old way for a family with kids', () => {
    const build = PATHS.family.build({ ages: 'primary', blocker: 'work', goodWeekend: 'outdoors' }, base);
    expect(protocols(build)).toEqual(expect.arrayContaining(['family-adventure', 'one-on-one-child']));
  });
});

describe('relationship: who it is about', () => {
  it('nobody right now builds friends practices and no partner-shaped promises', () => {
    for (const level of LEVEL_ORDER) {
      const build = PATHS.relationship.build({ with: 'solo', temperature: 'good', obstacle: 'drift', window: 'weekend', level }, nobody);
      expect(protocols(build)).toEqual(expect.arrayContaining(['friend-reach-out', 'good-news-response']));
      for (const p of protocols(build)) expect(p).not.toMatch(/partner|state-of-us|repair|reappraisal/);
      for (const m of milestones(build)) expect(m).not.toMatch(/both|together/i);
      // Weekend-only still means weekend-only.
      for (const r of build.routines.filter((x) => !x.ladderRung)) expect(r.days.every((d) => d === 0 || d === 6)).toBe(true);
    }
    expect(PATHS.relationship.insights({ with: 'solo' }, nobody)[0]).toMatch(/people you chose/i);
  });

  it('answers saved before the question existed stay on the partner build — the friends build is chosen, never inferred', () => {
    expect(protocols(PATHS.relationship.build({ temperature: 'good' }, nobody))).toContain('partner-appreciation');
    expect(protocols(PATHS.relationship.build({ temperature: 'good' }, nobody))).not.toContain('friend-reach-out');
  });

  it('"not sure what to call it" gets the early-days build and its own line', () => {
    const build = PATHS.relationship.build({ with: 'unsure', temperature: 'good', obstacle: 'drift', window: 'early' }, nobody);
    expect(protocols(build)).toContain('partner-novelty');
    expect(protocols(build)).not.toContain('state-of-us');
    expect(PATHS.relationship.insights({ with: 'unsure' }, nobody)[0]).toMatch(/not sure what it is yet/i);
  });

  it('early days: the cheap practices and something new, no monthly state-of-us', () => {
    const build = PATHS.relationship.build({ with: 'early', temperature: 'good', obstacle: 'drift', window: 'early' }, nobody);
    expect(protocols(build)).toEqual(expect.arrayContaining(['partner-appreciation', 'partner-novelty', 'turning-toward']));
    expect(protocols(build)).not.toContain('state-of-us');
  });

  it('conflict gets the tested version of repair — the written third-person look — not the rehearsed phrase', () => {
    const build = PATHS.relationship.build({ with: 'partner', temperature: 'tense', obstacle: 'conflict', window: 'after_bed' }, base);
    expect(protocols(build)).toContain('conflict-reappraisal-write');
    expect(protocols(build)).not.toContain('repair-rehearsal');
    expect(build.routines.filter((r) => r.sessionType === 'journal')).toHaveLength(1);
  });

  it('drifting adds answering the small things, and a hard patch still shrinks to two', () => {
    const drift = PATHS.relationship.build({ with: 'partner', temperature: 'drifting', obstacle: 'drift', window: 'after_bed' }, base);
    expect(protocols(drift)).toContain('turning-toward');
    const hard = PATHS.relationship.build({ with: 'partner', temperature: 'hard', obstacle: 'drift', window: 'after_bed' }, base);
    expect(protocols(hard)).toEqual(['partner-reunion', 'partner-appreciation']);
  });
});
