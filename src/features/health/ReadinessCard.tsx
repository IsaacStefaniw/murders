import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { readinessFrom } from '@/features/health/readiness';
import { DEBT_SHOW_H, bedtimeToRecover, energyShape, hoursLabel, sleepDebt } from '@/features/health/sleepDebt';
import { formatTime } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * This morning's read, when there is one: recovery against the person's
 * own two-week normal, and sleep debt against their own need.
 *
 * Renders nothing at all on the ordinary day, which is most days — the
 * signal is worth something precisely because it does not appear every
 * morning. A card that says "you're ready!" daily is wallpaper by week two,
 * and then says nothing on the morning it matters. Sleep debt appears
 * from two hours, with the bedtime tonight that starts paying it back,
 * and the window today's energy is best spent in.
 *
 * It never diagnoses. It names the person's own numbers, says what the
 * day does about it, and stops.
 */
export function ReadinessCard() {
  const metrics = useAppStore((s) => s.metrics);
  const profile = useAppStore((s) => s.profile);
  const readiness = useMemo(() => readinessFrom(metrics), [metrics]);
  const debt = useMemo(() => sleepDebt(metrics), [metrics]);
  const showDebt = !!debt && debt.debtH >= DEBT_SHOW_H;
  if (!readiness && !showDebt) return null;

  const bedtime = showDebt && profile ? bedtimeToRecover(profile.wakeTime, debt.needH, profile.sleepTime) : null;
  const energy = profile ? energyShape(profile.wakeTime, profile.energyProfile) : null;

  return (
    <Card style={styles.card}>
      <AppText variant="label" color="textSecondary">
        This morning
      </AppText>
      <AppText variant="heading" style={styles.gap}>
        {readiness
          ? readiness.headline
          : debt!.band === 'well-behind'
            ? 'Well behind on sleep. Today is for the main things only.'
            : 'A little behind on sleep. Keep today honest.'}
      </AppText>
      <View style={styles.signals}>
        {readiness?.signals.map((s) => (
          <AppText key={s} variant="secondary" color="textSecondary">
            {s}
          </AppText>
        ))}
        {showDebt ? (
          <AppText variant="secondary" color="textSecondary">
            Sleep debt {hoursLabel(debt.debtH)} over the last {debt.nights} nights — averaging{' '}
            {debt.averageH}h against {debt.needFrom === 'nights' ? 'your own' : 'an estimated'} need of{' '}
            {hoursLabel(debt.needH)}.
            {bedtime
              ? ` In bed by ${formatTime(bedtime.bedtime)} tonight recovers ${hoursLabel(bedtime.recoversH)}.`
              : ''}
          </AppText>
        ) : null}
        {energy ? (
          <AppText variant="secondary" color="textSecondary">
            Your best hours are {formatTime(energy.peak.start)}–{formatTime(energy.peak.end)}; the dip
            lands around {formatTime(energy.dip.start)}. Hard thinking early, the walk in the dip.
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        Measured against your own nights, never a population average —
        these numbers only mean anything relative to you.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  gap: { marginTop: Spacing.sm },
  signals: { marginTop: Spacing.sm, gap: Spacing.xs },
});
