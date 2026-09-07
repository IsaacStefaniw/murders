import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/charts';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { focusHours, summariseFocus, weeklyFocus } from '@/features/work/focus';
import { deepHoursTarget } from '@/features/work/programme';
import { todayKey } from '@/lib/dates';
import { deriveWorkInputs, useAppStore } from '@/state/store';

/**
 * Focus time on the Progress screen: eight weeks of hours, from the
 * blocks ticked off on the plan or the hours the person typed, against
 * the honest target. Renders nothing until the work coach is running or a
 * focus number exists, like every other section on that screen.
 */
export function WorkNumbers() {
  const profile = useAppStore((s) => s.profile);
  const paths = useAppStore((s) => s.paths);
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const metrics = useAppStore((s) => s.metrics);

  const today = todayKey();
  const entry = paths.work;
  const weeks = useMemo(
    () => weeklyFocus(plans, routines, metrics, today, 8),
    [plans, routines, metrics, today],
  );
  const target = profile ? deepHoursTarget(deriveWorkInputs(profile, entry?.answers)) : 0;
  const summary = useMemo(() => summariseFocus(weeks, target), [weeks, target]);

  const anything = weeks.some((w) => w.planned > 0 || w.loggedHours !== null);
  if (!entry && !anything) return null;
  if (!anything) return null;

  return (
    <>
      <SectionHeader title="Focus time" />
      <Card>
        <View style={styles.row}>
          <AppText variant="body" style={styles.grow}>
            Hours a week
          </AppText>
          <AppText variant="heading">{summary.thisWeek} h</AppText>
        </View>
        <AppText variant="caption" color="textTertiary">
          Focus blocks you ticked off, or the hours you logged for the week. Your target is about{' '}
          {target} h a week. Last eight weeks, oldest first.
        </AppText>
        <View style={styles.gap}>
          <BarChart
            data={weeks.map((w) => ({
              value: focusHours(w),
              label: w.weekStart.slice(5).replace('-', '/'),
            }))}
            format={(n) => `${Math.round(n * 10) / 10} h`}
          />
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          {summary.line}
          {summary.priorMean !== null ? ` Earlier weeks: about ${summary.priorMean} h.` : ''}
        </AppText>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.md },
  grow: { flexShrink: 1, flexGrow: 1 },
  gap: { marginTop: Spacing.sm },
});
