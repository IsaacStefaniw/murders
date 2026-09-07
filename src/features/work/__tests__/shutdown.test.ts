import {
  FIRST_THING_FOR_KEY,
  FIRST_THING_KEY,
  WEEK_LEVER_KEY,
  closeDay,
  nextWorkDay,
  pendingFirstThing,
  restoreLever,
} from '@/features/work/shutdown';

const FRIDAY = '2026-09-11';
const WEEKDAYS = [1, 2, 3, 4, 5] as const;

describe('nextWorkDay', () => {
  it('skips the weekend for a Monday-to-Friday week', () => {
    expect(nextWorkDay(FRIDAY, [...WEEKDAYS])).toBe('2026-09-14');
    expect(nextWorkDay('2026-09-09', [...WEEKDAYS])).toBe('2026-09-10');
  });

  it('is tomorrow when the week has no shape', () => {
    expect(nextWorkDay(FRIDAY, [])).toBe('2026-09-12');
  });
});

describe('closeDay — tomorrow’s first thing, carried to tomorrow', () => {
  it('names the day it is for and puts the first thing on the goal', () => {
    const r = closeDay({
      firstThing: '  Finish the pricing memo ',
      today: FRIDAY,
      workDays: [...WEEKDAYS],
      answers: {},
      currentFocus: undefined,
    });
    expect(r).toEqual({
      forDate: '2026-09-14',
      answersPatch: { [FIRST_THING_KEY]: 'Finish the pricing memo', [FIRST_THING_FOR_KEY]: '2026-09-14' },
      nextFocus: 'Finish the pricing memo',
    });
  });

  it('keeps the week’s lever aside the first time a first thing replaces it', () => {
    const r = closeDay({
      firstThing: 'Call the two warm leads',
      today: '2026-09-09',
      workDays: [...WEEKDAYS],
      answers: {},
      currentFocus: 'Ship the onboarding rewrite',
    });
    expect(r!.answersPatch[WEEK_LEVER_KEY]).toBe('Ship the onboarding rewrite');
  });

  it('a second close in a row does not overwrite the lever with yesterday’s first thing', () => {
    const r = closeDay({
      firstThing: 'Draft the board note',
      today: '2026-09-10',
      workDays: [...WEEKDAYS],
      answers: { [FIRST_THING_KEY]: 'Call the two warm leads', [WEEK_LEVER_KEY]: 'Ship the onboarding rewrite' },
      currentFocus: 'Call the two warm leads',
    });
    expect(r!.answersPatch[WEEK_LEVER_KEY]).toBeUndefined();
    expect(r!.nextFocus).toBe('Draft the board note');
  });

  it('an empty line closes nothing', () => {
    expect(closeDay({ firstThing: '   ', today: FRIDAY, workDays: [], answers: {}, currentFocus: undefined })).toBeNull();
  });
});

describe('pendingFirstThing', () => {
  it('is the first thing until its day has passed', () => {
    const answers = { [FIRST_THING_KEY]: 'Finish the memo', [FIRST_THING_FOR_KEY]: '2026-09-14' };
    expect(pendingFirstThing(answers, '2026-09-11')).toEqual({ text: 'Finish the memo', forDate: '2026-09-14' });
    expect(pendingFirstThing(answers, '2026-09-14')).not.toBeNull();
    expect(pendingFirstThing(answers, '2026-09-15')).toBeNull();
    expect(pendingFirstThing(undefined, '2026-09-11')).toBeNull();
  });
});

describe('restoreLever — the lever goes back once the day has passed', () => {
  const answers = {
    [FIRST_THING_KEY]: 'Finish the memo',
    [FIRST_THING_FOR_KEY]: '2026-09-14',
    [WEEK_LEVER_KEY]: 'Ship the onboarding rewrite',
  };

  it('does nothing while the first thing is still ahead', () => {
    expect(restoreLever({ today: '2026-09-14', answers, currentFocus: 'Finish the memo' })).toBeNull();
  });

  it('puts the lever back and clears the first thing the day after', () => {
    const r = restoreLever({ today: '2026-09-15', answers, currentFocus: 'Finish the memo' });
    expect(r).toEqual({
      answersPatch: { [FIRST_THING_KEY]: '', [FIRST_THING_FOR_KEY]: '' },
      nextFocus: 'Ship the onboarding rewrite',
    });
    // Applied, it is null next time: a hub can call it on every render.
    expect(restoreLever({ today: '2026-09-15', answers: { ...answers, ...r!.answersPatch }, currentFocus: r!.nextFocus })).toBeNull();
  });

  it('leaves a focus somebody else changed alone', () => {
    const r = restoreLever({ today: '2026-09-15', answers, currentFocus: 'A new lever from the review' });
    expect(r!.nextFocus).toBe('A new lever from the review');
  });

  it('with no lever kept, the goal goes back to having no next step', () => {
    const r = restoreLever({
      today: '2026-09-15',
      answers: { [FIRST_THING_KEY]: 'Finish the memo', [FIRST_THING_FOR_KEY]: '2026-09-14' },
      currentFocus: 'Finish the memo',
    });
    expect(r!.nextFocus).toBeUndefined();
  });
});
