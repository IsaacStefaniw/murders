import { weekReviewChanges, type WeekChange } from '@/features/work/review';
import { newId } from '@/lib/dates';
import type { LifeProfile, Routine } from '@/types/domain';

const profile = { workStart: '08:30', workEnd: '17:00' } as LifeProfile;

const block = (preferredStart = '09:15', durationMin = 60): Routine => ({
  id: newId('r'),
  title: 'Deep work block',
  area: 'work',
  goalId: 'g1',
  protocolId: 'deep-work',
  days: [1, 2],
  durationMin,
  preferredStart,
  preferredEnd: '10:15',
  energy: 'morning',
  flexible: false,
  protected: false,
  duringWork: true,
  tier: 'must',
  active: true,
});

const practice = (protocolId: string): Routine => ({
  ...block(),
  id: newId('r'),
  title: protocolId,
  protocolId,
});

const kinds = (changes: WeekChange[]) => changes.map((c) => c.kind);

describe('weekReviewChanges — three answers, next week changes', () => {
  it('a block lost to meetings moves to the start of the work day', () => {
    const b = block();
    const changes = weekReviewChanges({ held: 'none', ate: 'meetings', lever: '' }, { routines: [b], profile, goalId: 'g1' });
    expect(changes[0]).toMatchObject({
      kind: 'move_block',
      routineId: b.id,
      preferredStart: '08:30',
      preferredEnd: '10:00',
    });
    expect(changes[0].description).toContain('08:30');
  });

  it('already at the start of the day and still lost to meetings: cut one', () => {
    const b = block('08:30');
    const changes = weekReviewChanges({ held: 'some', ate: 'meetings', lever: '' }, { routines: [b], profile, goalId: 'g1' });
    expect(changes[0]).toMatchObject({ kind: 'add_practice', protocolId: 'meeting-trim' });
    // Not twice.
    const again = weekReviewChanges(
      { held: 'some', ate: 'meetings', lever: '' },
      { routines: [b, practice('meeting-trim')], profile, goalId: 'g1' },
    );
    expect(kinds(again)).toEqual(['keep']);
  });

  it('messages get the batching slot, whether or not the block held', () => {
    const held = weekReviewChanges({ held: 'all', ate: 'messages', lever: '' }, { routines: [block()], profile, goalId: 'g1' });
    expect(held[0]).toMatchObject({ kind: 'add_practice', protocolId: 'message-batching' });
    const already = weekReviewChanges(
      { held: 'all', ate: 'messages', lever: '' },
      { routines: [block(), practice('message-batching')], profile, goalId: 'g1' },
    );
    expect(kinds(already)).toEqual(['keep']);
  });

  it('drift shrinks the block to one that can be held, and never below 45', () => {
    const b = block('09:15', 90);
    const changes = weekReviewChanges({ held: 'none', ate: 'drift', lever: '' }, { routines: [b], profile, goalId: 'g1' });
    expect(changes[0]).toMatchObject({ kind: 'shorten_block', routineId: b.id, durationMin: 45 });
    const short = weekReviewChanges({ held: 'none', ate: 'drift', lever: '' }, { routines: [block('09:15', 45)], profile, goalId: 'g1' });
    expect(kinds(short)).toEqual(['keep']);
  });

  it('other people’s urgent things move the block earlier and batch the messages', () => {
    const changes = weekReviewChanges({ held: 'some', ate: 'others', lever: '' }, { routines: [block()], profile, goalId: 'g1' });
    expect(kinds(changes)).toEqual(['move_block', 'add_practice']);
  });

  it('a block that held is left exactly where it is', () => {
    const changes = weekReviewChanges({ held: 'all', ate: 'nothing', lever: '' }, { routines: [block()], profile, goalId: 'g1' });
    expect(kinds(changes)).toEqual(['keep']);
    expect(changes[0].description).toMatch(/Same time, same days/);
  });

  it('the lever becomes the goal’s next step, on top of the calendar change', () => {
    const changes = weekReviewChanges(
      { held: 'none', ate: 'meetings', lever: '  Ship the pricing page ' },
      { routines: [block()], profile, goalId: 'g1' },
    );
    expect(kinds(changes)).toEqual(['move_block', 'set_lever']);
    expect(changes[1]).toMatchObject({ kind: 'set_lever', text: 'Ship the pricing page' });
  });

  it('only the work goal’s own block is moved', () => {
    const someoneElses = { ...block(), goalId: 'g2' };
    const changes = weekReviewChanges({ held: 'none', ate: 'meetings', lever: '' }, { routines: [someoneElses], profile, goalId: 'g1' });
    expect(kinds(changes)).toEqual(['keep']);
  });

  it('with no profile the start of the day is nine', () => {
    const changes = weekReviewChanges({ held: 'none', ate: 'meetings', lever: '' }, { routines: [block()], profile: null, goalId: 'g1' });
    expect(changes[0]).toMatchObject({ kind: 'move_block', preferredStart: '09:00' });
  });
});
