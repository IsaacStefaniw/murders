import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Chip } from '@/components/chip';
import { Spacing } from '@/constants/theme';
import { protocolById } from '@/features/knowledge/protocols';
import { HABIT_PROTOCOL } from '@/features/onboarding/buildPlan';
import { useAppStore } from '@/state/store';
import type { ExistingHabitKey, LifeArea } from '@/types/domain';

/**
 * "I had a sauna tonight."
 *
 * Before this there was no way to record anything the plan did not already
 * contain — a system that learns from what actually happens could not see
 * most of what actually happened. One tap appends a completed item to the
 * day, so unplanned effort reaches week momentum, the goal composer's
 * streak and count rungs, and the adaptation engine exactly like planned
 * effort does.
 *
 * The vocabulary is the habit list the interview already uses, ordered by
 * what this user told us they actually do — so the first chips are theirs.
 */

type LoggableHabit = {
  key: ExistingHabitKey;
  label: string;
  area: LifeArea;
  durationMin: number;
};

const HABITS: LoggableHabit[] = [
  { key: 'workout', label: 'Workout', area: 'health', durationMin: 45 },
  { key: 'walking', label: 'Walk', area: 'health', durationMin: 30 },
  { key: 'running', label: 'Run', area: 'health', durationMin: 35 },
  { key: 'sauna', label: 'Sauna', area: 'health', durationMin: 20 },
  { key: 'cold', label: 'Cold', area: 'health', durationMin: 5 },
  { key: 'meditation', label: 'Meditation', area: 'health', durationMin: 10 },
  { key: 'journaling', label: 'Journalled', area: 'growth', durationMin: 5 },
  { key: 'fasting', label: 'Held the window', area: 'health', durationMin: 5 },
];

/** The user's own habits first — the rest stay available, just later. */
function ordered(mine: ExistingHabitKey[] | undefined): LoggableHabit[] {
  if (!mine?.length) return HABITS;
  const own = new Set(mine);
  return [...HABITS].sort((a, b) => Number(own.has(b.key)) - Number(own.has(a.key)));
}

export function QuickLog() {
  const profile = useAppStore((s) => s.profile);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const log = (habit: LoggableHabit) => {
    // Prefer the protocol's own title and duration, so a logged sauna reads
    // the same as a scheduled one and carries the same evidence story.
    const protocol = protocolById(HABIT_PROTOCOL[habit.key] ?? '');
    logCompletedActivity({
      title: protocol?.title ?? habit.label,
      area: protocol?.area ?? habit.area,
      durationMin: protocol?.durationMin ?? habit.durationMin,
      sessionType: protocol?.sessionType,
      note: 'logged after the fact',
    });
    setJustLogged(habit.label);
  };

  return (
    <View>
      <View style={styles.chipsRow}>
        {ordered(profile?.existingHabits).map((habit) => (
          <Chip key={habit.key} label={habit.label} onPress={() => log(habit)} />
        ))}
      </View>
      <AppText variant="caption" color={justLogged ? 'accent' : 'textTertiary'} style={styles.hint}>
        {justLogged
          ? `${justLogged} added to today. It counts toward everything it should.`
          : 'Did something that wasn’t on the plan? One tap and it’s on the day.'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { marginTop: Spacing.sm },
});
