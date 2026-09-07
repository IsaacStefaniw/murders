import { composition, familyVariant, withoutMatching, KIDS_ONLY, OUTINGS } from '@/features/family/composition';
import type { LifeProfile, Routine } from '@/types/domain';

const profile = (people: LifeProfile['people'], kidsCount?: number): LifeProfile =>
  ({ people, kidsCount } as unknown as LifeProfile);

const partner = { id: 'p', name: 'Alex', relation: 'partner' as const };
const kids = { id: 'k', name: 'The kids', relation: 'child' as const };
const caredFor = { id: 'c', name: 'The person I care for', relation: 'family' as const };
const grandkids = { id: 'g', name: 'The grandchildren', relation: 'family' as const };

describe('household composition', () => {
  it('reads the intake first: "no kids" beats a stale kidsCount on the profile', () => {
    const c = composition({ ages: 'none' }, profile([partner, kids], 2));
    expect(c.kidsAtHome).toBe(false);
    expect(c.partner).toBe(true);
  });

  it('falls back to the interview when the intake has not answered', () => {
    const c = composition({}, profile([partner, kids, caredFor, grandkids], 2));
    expect(c.kidsAtHome).toBe(true);
    expect(c.caredFor).toBe(true);
    expect(c.grandkids).toBe(true);
  });

  it('a multi-answer with a teenager and an under-five is both', () => {
    const c = composition({ ages: 'teens,under5' }, profile([]));
    expect(c.teens).toBe(true);
    expect(c.underFive).toBe(true);
    expect(c.kidsAtHome).toBe(true);
  });

  it('grown-up kids who moved out are not kids at home', () => {
    const c = composition({ ages: 'adult' }, profile([]));
    expect(c.adultKids).toBe(true);
    expect(c.kidsAtHome).toBe(false);
  });

  it('"no one else" on the intake overrides the profile', () => {
    const c = composition({ others: 'nobody' }, profile([caredFor]));
    expect(c.caredFor).toBe(false);
  });
});

describe('the variant', () => {
  const c = (over: Partial<ReturnType<typeof composition>>) => ({
    underFive: false,
    primary: false,
    teens: false,
    adultKids: false,
    grandkids: false,
    caredFor: false,
    partner: false,
    kidsAtHome: false,
    ...over,
  });

  it('a carer gets the carer build whatever else is true', () => {
    expect(familyVariant(c({ caredFor: true, teens: true, kidsAtHome: true }))).toBe('carer');
  });

  it('teenagers only is the teenage build; a younger sibling makes it the young-kids build', () => {
    expect(familyVariant(c({ teens: true, kidsAtHome: true }))).toBe('teens');
    expect(familyVariant(c({ teens: true, primary: true, kidsAtHome: true }))).toBe('youngKids');
  });

  it('grandchildren without kids at home is the grandparent build', () => {
    expect(familyVariant(c({ grandkids: true }))).toBe('grandparent');
  });

  it('nobody young at all is the no-kids build', () => {
    expect(familyVariant(c({ partner: true }))).toBe('noKids');
    expect(familyVariant(c({ adultKids: true }))).toBe('noKids');
  });
});

describe('withoutMatching', () => {
  const r = (id: string, title: string): Routine =>
    ({ id, title, area: 'family', days: [6], durationMin: 10, preferredStart: '09:00', preferredEnd: '10:00', energy: 'any', flexible: true, protected: false, tier: 'should', active: true }) as Routine;

  it('drops the kids-only routines and milestones and keeps routineIds honest', () => {
    const build = {
      routines: [r('a', 'One-on-one time — one child, no phone'), r('b', 'Something neither of you has done')],
      goal: {
        routineIds: ['a', 'b'],
        milestones: [
          { id: 'm1', title: 'One-on-one time with each child', done: false },
          { id: 'm2', title: 'One outing that actually happened', done: false },
        ],
      },
    };
    const out = withoutMatching(build, KIDS_ONLY);
    expect(out.routines.map((x) => x.id)).toEqual(['b']);
    expect(out.goal.routineIds).toEqual(['b']);
    expect(out.goal.milestones.map((m) => m.title)).toEqual(['One outing that actually happened']);
    expect(withoutMatching(out, OUTINGS).goal.milestones).toEqual([]);
  });
});
