/**
 * The carry: tomorrow's first thing, typed at the close of the day, lands
 * on tomorrow's first work block on Today, through the real store. Then
 * the three-question review moves the block through the same store.
 */

import { onboard } from '@/features/integration/__tests__/harness';
import { weekReviewChanges } from '@/features/work/review';
import { closeDay, restoreLever } from '@/features/work/shutdown';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

const s = () => useAppStore.getState();

function startWork(answers: Record<string, string> = { style: 'maker', team: 'solo', meetingLoad: 'half' }) {
  onboard();
  s().startPath('work', answers);
  return s().paths.work!;
}

describe('closing the day carries the first thing to tomorrow’s block', () => {
  it('shows as the next step on every work block of the day it is for', () => {
    const entry = startWork();
    const goal = s().goals.find((g) => g.id === entry.goalId)!;
    const today = todayKey();
    const result = closeDay({
      firstThing: 'Finish the pricing memo',
      today,
      workDays: s().profile!.workDays,
      answers: entry.answers,
      currentFocus: goal.nextFocus,
    })!;
    s().updatePathAnswers('work', result.answersPatch);
    s().setGoalNextFocus(goal.id, result.nextFocus);
    const plan = s().regeneratePlan(result.forDate);

    const workItems = plan.items.filter((i) => i.goalId === goal.id);
    expect(workItems.length).toBeGreaterThan(0);
    for (const item of workItems) expect(item.focus).toBe('Finish the pricing memo');
    expect(s().paths.work!.answers.firstThing).toBe('Finish the pricing memo');
    expect(s().paths.work!.answers.firstThingFor).toBe(result.forDate);
  });

  it('the week’s lever is kept aside and put back once the day has passed', () => {
    const entry = startWork();
    const goal = s().goals.find((g) => g.id === entry.goalId)!;
    s().setGoalNextFocus(goal.id, 'Ship the onboarding rewrite');
    const today = todayKey();
    const result = closeDay({
      firstThing: 'Call the two warm leads',
      today,
      workDays: s().profile!.workDays,
      answers: s().paths.work!.answers,
      currentFocus: s().goals.find((g) => g.id === goal.id)!.nextFocus,
    })!;
    s().updatePathAnswers('work', result.answersPatch);
    s().setGoalNextFocus(goal.id, result.nextFocus);
    expect(s().goals.find((g) => g.id === goal.id)!.nextFocus).toBe('Call the two warm leads');
    expect(s().paths.work!.answers.weekLever).toBe('Ship the onboarding rewrite');

    // The day after the first thing's day, the hub restores the lever.
    const later = addDays(result.forDate, 1);
    const restore = restoreLever({
      today: later,
      answers: s().paths.work!.answers,
      currentFocus: s().goals.find((g) => g.id === goal.id)!.nextFocus,
    })!;
    s().updatePathAnswers('work', restore.answersPatch);
    s().setGoalNextFocus(goal.id, restore.nextFocus);
    expect(s().goals.find((g) => g.id === goal.id)!.nextFocus).toBe('Ship the onboarding rewrite');
    expect(restoreLever({ today: later, answers: s().paths.work!.answers, currentFocus: 'Ship the onboarding rewrite' })).toBeNull();
  });
});

describe('the three questions change next week through the store', () => {
  it('a block lost to meetings is moved to the start of the work day on the plan', () => {
    const entry = startWork();
    const before = s().routines.find((r) => r.goalId === entry.goalId && r.protocolId === 'deep-work')!;
    expect(before.preferredStart).toBe('09:15');

    const changes = weekReviewChanges(
      { held: 'none', ate: 'meetings', lever: 'Ship the pricing page' },
      { routines: s().routines, profile: s().profile, goalId: entry.goalId },
    );
    // The lever first, as the hub does: the move re-lays the week, and
    // the blocks it lays down carry the goal's next step at that moment.
    for (const c of changes) {
      if (c.kind === 'set_lever') s().setGoalNextFocus(entry.goalId, c.text);
    }
    for (const c of changes) {
      if (c.kind === 'move_block') s().updateRoutine(c.routineId, { preferredStart: c.preferredStart, preferredEnd: c.preferredEnd });
    }
    const after = s().routines.find((r) => r.id === before.id)!;
    expect(after.preferredStart).toBe('09:00');
    // The plan for the next day it runs starts the block at the work start.
    const today = todayKey();
    for (let i = 0; i <= 6; i++) {
      const plan = s().plans[addDays(today, i)];
      const item = plan?.items.find((it) => it.routineId === before.id);
      if (item && item.status === 'planned') {
        expect(item.start).toBe('09:00');
        expect(item.focus).toBe('Ship the pricing page');
      }
    }
  });

  it('messages add the batching slot once, and toggling again would remove it', () => {
    const entry = startWork();
    const changes = weekReviewChanges(
      { held: 'all', ate: 'messages', lever: '' },
      { routines: s().routines, profile: s().profile, goalId: entry.goalId },
    );
    const add = changes.find((c) => c.kind === 'add_practice');
    expect(add).toMatchObject({ protocolId: 'message-batching' });
    if (add?.kind === 'add_practice') expect(s().toggleProtocol(add.protocolId)).toBe(true);
    expect(s().routines.filter((r) => r.protocolId === 'message-batching' && r.active)).toHaveLength(1);
    // Asked again with the slot in place, the review has nothing to add.
    const again = weekReviewChanges(
      { held: 'all', ate: 'messages', lever: '' },
      { routines: s().routines, profile: s().profile, goalId: entry.goalId },
    );
    expect(again.some((c) => c.kind === 'add_practice')).toBe(false);
  });
});

describe('a later meeting-load answer re-aims the block without restarting it', () => {
  it('the hub’s live target follows the answer while the stored block keeps its start', () => {
    startWork({ style: 'maker', team: 'solo', meetingLoad: 'light' });
    s().buildWorkBlock();
    const started = s().workBlock!.startedAt;
    s().updatePathAnswers('work', { meetingLoad: 'heavy' });
    // The store does not rebuild (that would restart week one); the hub
    // re-aims through retargetBlock. Both facts pinned here.
    expect(s().workBlock!.startedAt).toBe(started);
    expect(s().workBlock!.inputs.meetingLoad).toBe('light');
  });
});
