import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { weekStartOf } from '@/features/behaviours/weekly';
import {
  CAPACITY_BLURB,
  CAPACITY_LABEL,
  CAPACITY_ORDER,
  effectiveCapacity,
  weekLoad,
} from '@/features/planner/load';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * "This week is chaos. Make it smaller."
 *
 * The one control a busy person actually needs weekly, and the thing the
 * app had no gear for. Capacity was asked once at signup, treated as a
 * property of the person, and editable only three taps deep in Settings —
 * so a normal week and a launch week got the same plan.
 *
 * Three taps wide, no confirmation, takes effect on the spot. Choosing is
 * not a failure and nothing here says it is: the labels are Light, Normal
 * and Room to push, and none of them is the "right" one.
 *
 * Under it, what the plan did on its own and why — because a week that
 * quietly shrank without saying so is a week the person cannot trust.
 */
export function WeekSizeCard() {
  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const overrides = useAppStore((s) => s.weekCapacities);
  const setWeekCapacity = useAppStore((s) => s.setWeekCapacity);

  const today = todayKey();
  const thisWeek = weekStartOf(today);

  const gear = useMemo(
    () =>
      effectiveCapacity({
        stated: profile?.capacity ?? 'steady',
        overrides,
        plans,
        date: today,
      }),
    [profile?.capacity, overrides, plans, today],
  );

  const lastWeek = useMemo(
    () => weekLoad(plans, weekStartOf(addDays(thisWeek, -7))),
    [plans, thisWeek],
  );

  if (!profile) return null;

  return (
    <Card>
      <AppText variant="label" color="textSecondary">
        This week
      </AppText>
      <View style={styles.chips}>
        {CAPACITY_ORDER.map((c) => (
          <Chip
            key={c}
            label={CAPACITY_LABEL[c]}
            selected={gear.capacity === c}
            onPress={() => setWeekCapacity(thisWeek, c)}
          />
        ))}
      </View>
      <AppText variant="secondary" style={styles.gap}>
        {CAPACITY_BLURB[gear.capacity]}
      </AppText>

      {gear.line ? (
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          {gear.line}
        </AppText>
      ) : lastWeek.rate !== null ? (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Last week you cleared {lastWeek.completed} of {lastWeek.planned}.
        </AppText>
      ) : null}

      {gear.source === 'you' ? (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          You set this one. It goes back to following your weeks on Monday.
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  gap: { marginTop: Spacing.sm },
});
