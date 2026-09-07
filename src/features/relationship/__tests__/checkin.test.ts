import {
  CHECKIN_QUESTIONS,
  checkinHasAnswers,
  checkinPlanItems,
  checkinShareText,
  nextCheckinDate,
  nextWeekStart,
} from '@/features/relationship/checkin';

describe('the weekly two-of-you check-in', () => {
  it('asks exactly three questions', () => {
    expect(CHECKIN_QUESTIONS.map((q) => q.key)).toEqual(['keep', 'swap', 'need']);
  });

  it('next week starts on the coming Monday, from any day', () => {
    expect(nextWeekStart('2026-03-04')).toBe('2026-03-09'); // Wednesday
    expect(nextWeekStart('2026-03-08')).toBe('2026-03-09'); // Sunday
    expect(nextWeekStart('2026-03-09')).toBe('2026-03-16'); // Monday: the week after
  });

  it('the check-in lives on Sunday evening — today if today is Sunday', () => {
    expect(nextCheckinDate('2026-03-04')).toBe('2026-03-08');
    expect(nextCheckinDate('2026-03-08')).toBe('2026-03-08');
  });

  it('two of the three answers become next week’s plan', () => {
    const items = checkinPlanItems(
      { keep: 'The Thursday walk', swap: 'I do Tuesday pick-up', need: 'An evening with no plans' },
      '2026-03-04',
      'Anna',
    );
    expect(items).toEqual([
      { date: '2026-03-09', title: 'Swap this week: I do Tuesday pick-up', area: 'family', start: '19:00', durationMin: 10 },
      { date: '2026-03-11', title: 'For Anna: An evening with no plans', area: 'relationship', start: '19:30', durationMin: 30 },
    ]);
  });

  it('the thing to keep is kept as words, not as a second calendar block', () => {
    expect(checkinPlanItems({ keep: 'Thursday walk' }, '2026-03-04', 'Anna')).toEqual([]);
  });

  it('ignores blank answers and works without a partner name', () => {
    const items = checkinPlanItems({ swap: '   ', need: 'A lie-in' }, '2026-03-04');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('For them: A lie-in');
    expect(checkinHasAnswers({ swap: '  ' })).toBe(false);
    expect(checkinHasAnswers({ need: 'x' })).toBe(true);
  });

  it('shares as a short message and says nothing when there is nothing to say', () => {
    const text = checkinShareText({ keep: 'Thursday walk', need: 'A lie-in' }, 'Anna');
    expect(text).toBe('Our check-in, Anna:\nKeeping: Thursday walk\nYou asked for: A lie-in — it is on my week.');
    expect(checkinShareText({}, 'Anna')).toBe('');
  });
});
