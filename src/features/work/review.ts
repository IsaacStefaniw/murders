/**
 * Three questions whose answers change next week.
 *
 * The evidence for a weekly review is not for the ritual; it is for what
 * a good one produces — a recorded read on progress (Harkin et al. 2016)
 * and a specific when-and-where plan for the next week (Gollwitzer &
 * Sheeran 2006). A review that describes last week has neither. So each
 * answer here maps to a change the store can apply: the focus block
 * moves, a practice is added, the block shrinks to a size that survives,
 * and the lever becomes the goal's next step.
 *
 * Pure. The hub applies the changes through `updateRoutine`,
 * `toggleProtocol` and `setGoalNextFocus`, and records the answers in the
 * work path's answers so the next block build can read them.
 */

import { toHHMM, toMinutes } from '@/lib/dates';
import { FOCUS_PROTOCOLS } from '@/features/work/focus';
import type { LifeProfile, Routine } from '@/types/domain';

export type BlockHeld = 'all' | 'most' | 'some' | 'none';
export type Eater = 'meetings' | 'messages' | 'others' | 'drift' | 'nothing';

export interface WeekReviewAnswers {
  held: BlockHeld;
  ate: Eater;
  lever: string;
}

export const HELD_OPTIONS: { value: BlockHeld; label: string }[] = [
  { value: 'all', label: 'Every one' },
  { value: 'most', label: 'Most' },
  { value: 'some', label: 'One or two' },
  { value: 'none', label: 'None' },
];

export const EATER_OPTIONS: { value: Eater; label: string }[] = [
  { value: 'meetings', label: 'Meetings' },
  { value: 'messages', label: 'Email and messages' },
  { value: 'others', label: 'Other people’s urgent things' },
  { value: 'drift', label: 'I drifted' },
  { value: 'nothing', label: 'Nothing, it held' },
];

export type WeekChange =
  | {
      kind: 'move_block';
      routineId: string;
      preferredStart: string;
      preferredEnd: string;
      description: string;
    }
  | { kind: 'shorten_block'; routineId: string; durationMin: number; description: string }
  | { kind: 'add_practice'; protocolId: string; description: string }
  | { kind: 'set_lever'; text: string; description: string }
  | { kind: 'keep'; description: string };

/** Keys the answers are recorded under in the work path's answers. */
export const REVIEW_KEYS = {
  held: 'reviewHeld',
  ate: 'reviewAte',
  week: 'reviewedWeek',
} as const;

function focusBlock(routines: Routine[], goalId: string | undefined): Routine | undefined {
  return routines.find(
    (r) => r.active && !!r.protocolId && FOCUS_PROTOCOLS.has(r.protocolId) && (!goalId || r.goalId === goalId),
  );
}

function hasPractice(routines: Routine[], protocolId: string): boolean {
  return routines.some((r) => r.active && r.protocolId === protocolId);
}

/**
 * What next week changes, from this week's three answers.
 *
 * The rules are the coach's, written down: a block that did not survive
 * meetings goes to the start of the day, before the first call; a block
 * eaten by messages gets the batching slot beside it; a block the person
 * drifted out of gets shorter, because a block you hold beats one you
 * cannot; a held block is left exactly where it is.
 */
export function weekReviewChanges(
  answers: WeekReviewAnswers,
  ctx: { routines: Routine[]; profile: LifeProfile | null; goalId?: string },
): WeekChange[] {
  const changes: WeekChange[] = [];
  const block = focusBlock(ctx.routines, ctx.goalId);
  const workStart = ctx.profile?.workStart ?? '09:00';
  const lost = answers.held === 'none' || answers.held === 'some';

  if (block && lost && (answers.ate === 'meetings' || answers.ate === 'others')) {
    const atStart = block.preferredStart === workStart;
    if (!atStart) {
      const end = toHHMM((toMinutes(workStart) + block.durationMin + 30) % 1440);
      changes.push({
        kind: 'move_block',
        routineId: block.id,
        preferredStart: workStart,
        preferredEnd: end,
        description: `Your focus block moves to ${workStart}, before the first call, on the days it runs.`,
      });
    } else if (answers.ate === 'meetings' && !hasPractice(ctx.routines, 'meeting-trim')) {
      changes.push({
        kind: 'add_practice',
        protocolId: 'meeting-trim',
        description: 'Fifteen minutes on Friday to cut or shorten one meeting you own.',
      });
    }
  }

  if (answers.ate === 'messages' && !hasPractice(ctx.routines, 'message-batching')) {
    changes.push({
      kind: 'add_practice',
      protocolId: 'message-batching',
      description: 'A booked slot for messages, so the rest of the day can stay closed.',
    });
  }

  if (block && lost && answers.ate === 'drift' && block.durationMin > 45) {
    changes.push({
      kind: 'shorten_block',
      routineId: block.id,
      durationMin: 45,
      description: 'The focus block shrinks to 45 minutes — a block you hold beats one you cannot.',
    });
  }

  if (block && lost && answers.ate === 'others' && !hasPractice(ctx.routines, 'message-batching')) {
    changes.push({
      kind: 'add_practice',
      protocolId: 'message-batching',
      description: 'Messages in a booked slot, so an urgent thing waits an hour instead of taking the block.',
    });
  }

  if (!lost && answers.ate === 'nothing') {
    changes.push({
      kind: 'keep',
      description: block
        ? 'The block held. Same time, same days next week.'
        : 'Held. Nothing on the calendar changes.',
    });
  }

  const lever = answers.lever.trim();
  if (lever) {
    changes.push({
      kind: 'set_lever',
      text: lever,
      description: `Next week's one lever: ${lever}. It shows on every work block.`,
    });
  }

  if (changes.length === 0) {
    changes.push({
      kind: 'keep',
      description: 'Nothing on the calendar changes from these answers.',
    });
  }
  return changes;
}
