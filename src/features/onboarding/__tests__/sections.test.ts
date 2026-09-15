import {
  INTERVIEW_STEPS,
  activeSteps,
  isCore,
  optionsFor,
  placeholderFor,
  type InterviewAnswers,
  type InterviewStep,
} from '@/features/onboarding/script';
import {
  SECTION_OF,
  SECTION_ORDER,
  SETUP_SECTIONS,
  isAnswered,
  sectionDef,
  sectionOf,
  sectionsRemaining,
  setupSteps,
  spineGaps,
} from '@/features/onboarding/sections';

/**
 * Setup asks everything.
 *
 * The old model asked thirteen questions and deferred twenty-three into
 * coaches people never opened, which cost a family-first user a
 * family-shaped week and cost everyone six of ten marker components. The
 * tests here are the ones that stop it creeping back.
 */

describe('nothing is deferred any more', () => {
  it('asks every question the person has not ruled out', () => {
    const asked = setupSteps({}).map((s) => s.step.id);
    const possible = INTERVIEW_STEPS.filter((s) => !s.skipIf?.({})).map((s) => s.id);
    expect(asked.sort()).toEqual(possible.sort());
  });

  it('asks far more than the old spine did', () => {
    // The spine still exists and is still small. It is simply no longer
    // what setup runs.
    expect(setupSteps({}).length).toBeGreaterThan(activeSteps({}).length * 2);
  });

  it('asks the questions that used to be unreachable', () => {
    const asked = new Set(setupSteps({}).map((s) => s.step.id));
    // `age` gates the markers headline entirely; six of ten components sat
    // behind opening one of two coaches.
    for (const id of ['age', 'sexAtBirth', 'weight', 'selfRatedHealth', 'walkingPace']) {
      expect(asked.has(id)).toBe(true);
    }
  });

  it('still honours a question the answers have ruled out', () => {
    const withoutPartner = { household: ['kids'] };
    const asked = setupSteps(withoutPartner).map((s) => s.step.id);
    expect(asked).not.toContain('partnerName');
  });
});

describe('the eight sections', () => {
  it('gives every question a home', () => {
    const missing = INTERVIEW_STEPS.filter((s) => !SECTION_OF[s.id]).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it('maps only to sections that exist', () => {
    for (const id of Object.values(SECTION_OF)) expect(SECTION_ORDER).toContain(id);
  });

  it('runs in the sketch’s order, and starts on what you want less of', () => {
    expect(SECTION_ORDER).toEqual([
      'habits',
      'positives',
      'goals',
      'lifestyle',
      'health',
      'training',
      'money',
      'work',
    ]);
    expect(setupSteps({})[0].section).toBe('habits');
  });

  it('never interleaves two sections', () => {
    const seen: string[] = [];
    for (const { section } of setupSteps({})) {
      if (seen[seen.length - 1] !== section) seen.push(section);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('opens each section exactly once', () => {
    const opens = setupSteps({}).filter((s) => s.opensSection);
    expect(opens.map((s) => s.section)).toEqual(SECTION_ORDER);
  });
});

describe('every section says what it buys and what skipping costs', () => {
  it('has both lines, for all eight', () => {
    for (const id of SECTION_ORDER) {
      const d = sectionDef(id);
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.unlocks.length).toBeGreaterThan(0);
      expect(d.skipPrice.length).toBeGreaterThan(0);
    }
    expect(SETUP_SECTIONS).toHaveLength(8);
  });

  /**
   * A skip price is a cost, not a scolding. "You will get less out of
   * this" is a guilt trip; "your markers will read four of ten" is a
   * fact somebody can weigh.
   */
  it('prices the skip without shaming it', () => {
    for (const id of SECTION_ORDER) {
      const price = sectionDef(id).skipPrice;
      expect(price).toMatch(/^Skip —/);
      expect(price).not.toMatch(/should|ought|must|really need|serious about/i);
    }
  });
});

describe('the spine survives', () => {
  it('is still small, and still describes what the scheduler needs', () => {
    expect(activeSteps({}).length).toBeLessThanOrEqual(12);
  });

  it('reports what a half-finished setup is still missing', () => {
    const gaps = spineGaps({}).map((s) => s.id);
    expect(gaps).toContain('weekShape');
    expect(gaps.every((id) => isCore(INTERVIEW_STEPS.find((s) => s.id === id)!, {}))).toBe(true);
  });

  it('closes a gap as soon as it is answered', () => {
    const before = spineGaps({}).length;
    const after = spineGaps({ weekShape: 'standard' }).length;
    expect(after).toBe(before - 1);
  });
});

describe('the progress spine', () => {
  it('counts a section done whether it was answered or skipped', () => {
    expect(sectionsRemaining({}).size).toBe(8);
    const moneyDone = { money: 'mortgage', moneyAutomation: 'some' };
    expect(sectionsRemaining(moneyDone).has('money')).toBe(false);
    expect(sectionsRemaining(moneyDone).has('work')).toBe(true);
  });

  it('treats an empty multi-answer as unanswered', () => {
    expect(isAnswered({ priorities: [] }, 'priorities')).toBe(false);
    expect(isAnswered({ priorities: ['family'] }, 'priorities')).toBe(true);
    expect(isAnswered({}, 'priorities')).toBe(false);
  });
});

describe('sectionOf', () => {
  it('reads the map', () => {
    const sleep = INTERVIEW_STEPS.find((s) => s.id === 'sleep')!;
    expect(sectionOf(sleep)).toBe('lifestyle');
    const household = INTERVIEW_STEPS.find((s) => s.id === 'household')!;
    expect(sectionOf(household)).toBe('habits');
  });
});


/**
 * Nothing may be asked before the answer it reads.
 *
 * A step's options, placeholder and skipIf are all functions of earlier
 * answers — that is what makes "per market" real rather than cosmetic, and
 * it is also what breaks silently when a question moves. `lessOf` and
 * `moreOf` compute their options from `weekShape`; reordering setup put
 * them two sections ahead of it, which would have offered a retiree a
 * shift worker's list of vices with no error anywhere.
 *
 * This derives the dependency rather than trusting a comment: change an
 * earlier answer, see whether this step's surface changes, and if it does,
 * demand the ordering.
 */
describe('no question is asked before the answer it reads', () => {
  const PROBES: { id: string; value: InterviewAnswers[string] }[] = [
    { id: 'weekShape', value: 'retired' },
    { id: 'household', value: ['partner', 'kids'] },
    { id: 'priorities', value: ['family'] },
    { id: 'ambition', value: 'Deadlift 140 kg by March' },
    { id: 'name', value: 'Isaac' },
  ];

  const surface = (step: InterviewStep, answers: InterviewAnswers) =>
    JSON.stringify({
      options: (() => {
        try {
          return optionsFor(step, answers);
        } catch {
          return 'threw';
        }
      })(),
      placeholder: placeholderFor(step, answers),
      prompt: step.prompt(answers),
      skipped: Boolean(step.skipIf?.(answers)),
    });

  it('puts every dependency ahead of the step that reads it', () => {
    const order = setupSteps({}).map((s) => s.step.id);
    const offenders: string[] = [];

    for (const probe of PROBES) {
      const withProbe: InterviewAnswers = { [probe.id]: probe.value };
      for (const { step } of setupSteps({})) {
        if (step.id === probe.id) continue;
        if (surface(step, {}) === surface(step, withProbe)) continue;
        // This step reads `probe.id`. It must be asked after it.
        const dependsAt = order.indexOf(step.id);
        const answerAt = order.indexOf(probe.id);
        if (answerAt === -1 || answerAt > dependsAt) {
          offenders.push(`${step.id} reads ${probe.id}, which is asked later`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('opens on the name and the shape of the week', () => {
    expect(setupSteps({}).slice(0, 2).map((s) => s.step.id)).toEqual(['name', 'weekShape']);
  });
});
