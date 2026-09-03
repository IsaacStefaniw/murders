import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Spacing } from '@/constants/theme';
import { sessionForItem } from '@/features/modalities/registry';
import { smartMoveOptions } from '@/features/planner/moveOptions';
import {
  candidateStartsFor,
  type Displacement,
} from '@/features/planner/moveWithBump';
import { addDays, durationMinutes, formatTime, nowMinutes, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

interface ItemActionsProps {
  item: PlanItem;
  plan: DailyPlan;
  profile: LifeProfile;
  date: string;
  onDone?: () => void;
  /** Open straight into a mode — a long press goes to 'move'. */
  initialMode?: 'idle' | 'move';
}

/**
 * The single action surface for a plan item: Done, intelligent Move,
 * Shorten where it makes sense, and Skip that offers recovery before
 * surrender. Optimises for recovery, never guilt.
 */
export function ItemActions({
  item,
  plan,
  profile,
  date,
  onDone,
  initialMode = 'idle',
}: ItemActionsProps) {
  const router = useRouter();
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const moveItem = useAppStore((s) => s.moveItem);
  const moveItemToDate = useAppStore((s) => s.moveItemToDate);
  const shortenItem = useAppStore((s) => s.shortenItem);
  const goals = useAppStore((s) => s.goals);

  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);
  const [mode, setMode] = useState<'idle' | 'move' | 'choose' | 'skip' | 'milestone'>(initialMode);
  /** What else moved to make room. Shown once, then cleared on the next action. */
  const [knockOn, setKnockOn] = useState<Displacement[]>([]);
  const session = item.status === 'planned' ? sessionForItem(item, goals) : null;

  // Doing → progressing: completing a goal-linked block asks, once, whether
  // it moved the goal's next milestone. One tap writes real progress back.
  const goal = item.goalId ? goals.find((g) => g.id === item.goalId) : undefined;
  const nextMilestone = goal?.milestones?.find((m) => !m.done);

  const duration = durationMinutes(item.start, item.end);
  const isEffort = item.area === 'health' && duration >= 40;
  const isTogether = item.area === 'relationship' || item.area === 'family';

  const finish = () => {
    setMode('idle');
    onDone?.();
  };

  /**
   * Apply a move and keep whatever it displaced, so the person is told
   * rather than discovering later that their evening rearranged itself.
   */
  const applyMove = (start: string) => {
    const displaced = moveItem(date, item.id, start);
    setKnockOn(displaced);
    if (displaced.length === 0) finish();
    else setMode('idle');
  };

  if (mode === 'milestone' && goal && nextMilestone) {
    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          Did that move “{nextMilestone.title}”?
        </AppText>
        <View style={styles.chips}>
          <Chip
            label="Yes — done ✓"
            selected
            onPress={() => {
              setMilestoneDone(goal.id, nextMilestone.id, true);
              finish();
            }}
          />
          <Chip label="Not yet" onPress={finish} />
        </View>
      </View>
    );
  }

  if (item.status !== 'planned') {
    return (
      <View style={styles.row}>
        <Button title="Undo" variant="ghost" onPress={() => { setItemStatus(date, item.id, 'planned'); finish(); }} />
      </View>
    );
  }

  if (mode === 'move' || mode === 'choose') {
    const { options, allSlots } = smartMoveOptions(item, plan, profile, nowMinutes());
    // Every time of day, each priced by what it would displace — so the
    // choice belongs to the person rather than to the scheduler.
    // Only times still ahead. Offering the morning at 3pm was the whole of
    // the reported "moving it marks it done" defect: the chosen window was
    // already behind the current minute, so Today filed it under
    // "Earlier — did it happen?" and the move read as a verdict. On any
    // other day's plan every time is still ahead, so the day opens fully.
    const candidates = candidateStartsFor(plan, item.id, {
      wakeTime: profile.wakeTime,
      sleepTime: profile.sleepTime,
      notBefore: date === todayKey() ? nowMinutes() : undefined,
    });
    // A day with genuinely no room is a real answer, and saying so beats a
    // menu whose only entry is Tomorrow with no explanation of why.
    // Late enough that nothing more fits before bed. Tomorrow is the only
    // honest answer, and saying so beats a picker with nothing in it.
    if (mode === 'choose' && candidates.length === 0) {
      return (
        <View style={styles.column}>
          <AppText variant="caption" color="textTertiary">
            No time left today that fits {duration} minutes.
          </AppText>
          <View style={styles.chips}>
            <Chip
              label="Move to tomorrow"
              onPress={() => {
                moveItemToDate(date, item.id, addDays(date, 1));
                finish();
              }}
            />
            <Chip label="Cancel" onPress={() => setMode('idle')} />
          </View>
        </View>
      );
    }

    if (allSlots.length === 0) {
      return (
        <View style={styles.column}>
          <AppText variant="caption" color="textTertiary">
            Nothing free today that fits {duration} minutes. You can still take a time and
            move what is there.
          </AppText>
          <View style={styles.chips}>
            <Chip
              label="Pick a time anyway"
              hint="Shows every time of day, and what each one would move."
              onPress={() => setMode('choose')}
            />
            <Chip
              label="Move to tomorrow"
              onPress={() => {
                moveItemToDate(date, item.id, addDays(date, 1));
                finish();
              }}
            />
            {duration > 20 ? (
              <Chip
                label="Shorten to 20 min"
                hint="A shorter version may fit where the full one does not."
                onPress={() => {
                  shortenItem(date, item.id, 20);
                  finish();
                }}
              />
            ) : null}
            <Chip label="Cancel" onPress={() => setMode('idle')} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          Move to…
        </AppText>
        <View style={styles.chips}>
          {mode === 'move'
            ? options.map((o) => (
                <Chip
                  key={o.label}
                  label={o.kind === 'slot' ? `${o.label} (${formatTime(o.start!)})` : o.label}
                  onPress={() => {
                    if (o.kind === 'slot') {
                      applyMove(o.start!);
                    } else if (o.kind === 'tomorrow') {
                      moveItemToDate(date, item.id, addDays(date, 1));
                      finish();
                    } else {
                      setMode('choose');
                    }
                  }}
                />
              ))
            : candidates.map((c) => (
                <Chip
                  key={c.start}
                  label={
                    c.bumps > 0
                      ? `${formatTime(c.start)} · moves ${c.bumps}`
                      : c.hitsFixed
                        ? `${formatTime(c.start)} · during work`
                        : formatTime(c.start)
                  }
                  hint={
                    c.bumps > 0
                      ? 'Takes this time and shifts what is there to the nearest free slot.'
                      : c.hitsFixed
                        ? 'Overlaps a fixed commitment. Yours to choose.'
                        : undefined
                  }
                  onPress={() => applyMove(c.start)}
                />
              ))}
          <Chip label="Cancel" onPress={() => setMode('idle')} />
        </View>
      </View>
    );
  }

  if (mode === 'skip') {
    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          {isEffort ? `Can't fit ${duration} minutes?` : isTogether ? "Can't make it?" : 'Not today?'}
        </AppText>
        <View style={styles.chips}>
          {isEffort && duration > 20 ? (
            <Chip
              label="Shorten to 20 min"
              onPress={() => {
                shortenItem(date, item.id, 20);
                finish();
              }}
            />
          ) : null}
          {isTogether ? (
            <Chip
              label="Move to tomorrow"
              onPress={() => {
                moveItemToDate(date, item.id, addDays(date, 1));
                finish();
              }}
            />
          ) : null}
          <Chip label={isEffort ? 'Move it' : 'Find another time'} onPress={() => setMode('move')} />
          <Chip
            label={isTogether ? 'Skip this week' : 'Skip today'}
            onPress={() => {
              setItemStatus(date, item.id, 'skipped');
              finish();
            }}
          />
          <Chip label="Cancel" onPress={() => setMode('idle')} />
        </View>
      </View>
    );
  }

  if (knockOn.length > 0) {
    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          Moved to make room:
        </AppText>
        {knockOn.map((d) => (
          <AppText key={d.id} variant="secondary">
            {d.to
              ? `${d.title} → ${formatTime(d.to)}`
              : `${d.title} — no room left today, left where it was`}
          </AppText>
        ))}
        <View style={styles.chips}>
          <Chip
            label="Got it"
            selected
            onPress={() => {
              setKnockOn([]);
              finish();
            }}
          />
        </View>
      </View>
    );
  }

  /**
   * Start gets its own full-width row rather than a quarter of one.
   *
   * Four buttons across a phone could not fit: each carries 24pt of
   * padding either side, so the three fixed-width ones consumed the row and
   * Start — the only one with flex — was squeezed to a green square with
   * its label clipped away entirely. The primary action on a session-backed
   * item was invisible, which is close to the worst place to lose a label.
   *
   * The secondary row wraps as well, so the same thing cannot happen again
   * at a larger text size.
   */
  return (
    <View style={styles.column}>
      {session ? (
        <Button
          title="Start"
          hint="Opens the guided session for this block."
          onPress={() => {
            const query = new URLSearchParams(session.params).toString();
            router.push((query ? `${session.route}?${query}` : session.route) as never);
            onDone?.();
          }}
        />
      ) : null}
      <View style={styles.row}>
        <Button
          title="Done"
          variant={session ? 'secondary' : 'primary'}
          onPress={() => {
            setItemStatus(date, item.id, 'completed');
            if (goal && nextMilestone) {
              setMode('milestone');
            } else {
              finish();
            }
          }}
          style={styles.grow}
        />
        {!item.fixed ? (
          <Button title="Move" variant="secondary" onPress={() => setMode('move')} />
        ) : null}
        {!item.fixed ? <Button title="Skip" variant="ghost" onPress={() => setMode('skip')} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Wraps rather than crushing a label to nothing when the type scale grows.
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  column: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  grow: { flexGrow: 1, flexBasis: 'auto' },
});
