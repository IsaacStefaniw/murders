import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Sparkbars } from '@/components/charts';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LogDidIt } from '@/features/today/LogDidIt';
import {
  MARK_STATUS,
  dayResult,
  dayRows,
  rowLength,
  tomorrowFirst,
  type DayMark,
} from '@/features/review/dayReview';
import { addDays, formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * End of day — three taps, from Isaac's sketch.
 *
 * Replaces the mood scale and two text boxes. The columns are the day's
 * own items: did it, didn't, did something else. See
 * `features/review/dayReview.ts` for why the third column is the one that
 * matters and why the result line reports the week rather than the day.
 */

const MARKS: { value: DayMark; glyph: string; label: string }[] = [
  { value: 'did', glyph: '✓', label: 'Did it' },
  { value: 'didnt', glyph: '✗', label: 'Didn’t' },
  { value: 'instead', glyph: '+', label: 'Did something else' },
];

export default function DayReview() {
  const router = useRouter();
  const theme = useTheme();
  const date = todayKey();

  const plans = useAppStore((s) => s.plans);
  const setItemStatus = useAppStore((s) => s.setItemStatus);

  const rows = useMemo(() => dayRows(plans[date]), [plans, date]);
  const result = useMemo(() => dayResult(plans, date), [plans, date]);
  const next = useMemo(() => tomorrowFirst(plans, date), [plans, date]);
  const [instead, setInstead] = useState(false);

  const mark = (itemId: string, value: DayMark) => {
    setItemStatus(date, itemId, MARK_STATUS[value], {
      source: 'manual',
      confidence: 1,
      at: new Date().toISOString(),
      note: value === 'instead' ? 'did something else' : 'end of day review',
    });
    if (value === 'instead') setInstead(true);
  };

  return (
    <Screen>
      <AppText variant="label" color="textTertiary">
        End of day
      </AppText>
      <AppText variant="title">How did it go?</AppText>

      {rows.length === 0 ? (
        <Card style={styles.gap}>
          <AppText variant="secondary">
            Nothing was on today, so there is nothing to mark. Anything you did anyway can still go
            on the day.
          </AppText>
          <LogDidIt date={date} />
        </Card>
      ) : (
        <Card style={styles.gap}>
          {rows.map((row) => (
            <View key={row.item.id} style={[styles.row, { borderTopColor: theme.border }]}>
              <View style={styles.rowHead}>
                <AppText variant="caption" color="textTertiary" style={styles.time}>
                  {formatTime(row.item.start)}
                </AppText>
                <AppText variant="body" style={styles.grow}>
                  {row.item.title}
                </AppText>
                {rowLength(row.item) ? (
                  <AppText variant="caption" color="textTertiary">
                    {rowLength(row.item)}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.marks}>
                {MARKS.map((m) => {
                  const on = row.mark === m.value;
                  return (
                    <Pressable
                      key={m.value}
                      onPress={() => mark(row.item.id, m.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${row.item.title}: ${m.label}`}
                      style={[
                        styles.mark,
                        {
                          borderColor: on ? theme.accent : theme.border,
                          backgroundColor: on ? theme.accentSoft : 'transparent',
                        },
                      ]}
                    >
                      <AppText variant="body" color={on ? 'accent' : 'textTertiary'}>
                        {m.glyph}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <AppText variant="caption" color="textTertiary" style={styles.legend}>
            ✓ did it · ✗ didn’t · + did something else
          </AppText>
        </Card>
      )}

      {instead ? (
        <Card style={styles.gap}>
          <AppText variant="secondary">What did you do instead?</AppText>
          <LogDidIt date={date} />
        </Card>
      ) : null}

      <SectionHeader title="Result" />
      <Card>
        <AppText variant="heading">{result.line}</AppText>
        {result.weekTotal > 0 ? (
          <View style={styles.spark}>
            <Sparkbars
              data={result.trend.map((value, i) => ({
                label: addDays(date, i - 6),
                value,
              }))}
              accessibilityLabel={`${result.weekDone} of ${result.weekTotal} across the last seven days`}
              fromZero
            />
          </View>
        ) : null}
        {/* No percentage and no streak. A missed Tuesday is a missed
            Tuesday, not a reset to zero. */}
      </Card>

      {next ? (
        <>
          <SectionHeader title="Tomorrow" />
          <Card>
            <View style={styles.rowHead}>
              <AppText variant="caption" color="textTertiary" style={styles.time}>
                {formatTime(next.start)}
              </AppText>
              <AppText variant="body" style={styles.grow}>
                {next.title}
              </AppText>
            </View>
            <Button
              title="Move it"
              variant="secondary"
              style={styles.gap}
              hint="Opens tomorrow so you can change the time."
              onPress={() => router.push('/(tabs)/plan')}
            />
          </Card>
        </>
      ) : null}

      <Button title="Close the day" style={styles.close} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.md },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  time: { minWidth: 62 },
  grow: { flex: 1 },
  marks: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  mark: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
  },
  legend: { marginTop: Spacing.md },
  spark: { marginTop: Spacing.sm },
  close: { marginTop: Spacing.xl },
});
