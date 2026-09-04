/**
 * The line from the field report, as a test.
 *
 * "Nothing to look forward to this week. Saturday morning is open — dinner
 * somewhere new?" is wrong twice: it opens on an absence, and then names
 * the thing it just said was absent.
 */

import { checkTone, type Finding } from '@/features/sim/screens';
import { detectAnticipationGap } from '@/features/anticipation/lookAhead';

const findings = (text: string): Finding[] => {
  const out: Finding[] = [];
  checkTone(text, 'suggestion', out);
  return out;
};

describe('copy that opens on what is missing', () => {
  it('catches the exact line that shipped', () => {
    const out = findings(
      'Nothing to look forward to this week. Saturday morning is open — dinner somewhere new?',
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].rule).toBe('copy does not open on what is missing');
  });

  it('catches the other deficit openers', () => {
    expect(findings("You haven't logged anything this week.")).toHaveLength(1);
    expect(findings('You missed three sessions.')).toHaveLength(1);
  });

  it('leaves honest copy alone, including copy that mentions an absence', () => {
    expect(findings('Saturday morning is wide open — a morning outdoors?')).toHaveLength(0);
    expect(findings('Two sessions this week, and nothing on the calendar for Sunday.')).toHaveLength(0);
    expect(findings('Yours to spend — want to put something in it?')).toHaveLength(0);
  });
});

describe('the look-ahead suggestion itself', () => {
  it('no longer contradicts itself', () => {
    // An empty week: no plans, so the gap detector has something to say.
    const profile = {
      firstName: 'Sam',
      wakeTime: '06:30',
      sleepTime: '22:30',
      moreOf: [],
      priorities: [],
      people: [],
    } as never;
    const suggestion = detectAnticipationGap('2026-09-02', {}, [], profile);
    expect(suggestion).not.toBeNull();
    expect(findings(suggestion!.message)).toHaveLength(0);
    expect(suggestion!.message).not.toMatch(/^Nothing/i);
  });
});
