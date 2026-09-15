import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Sparkbars } from '@/components/charts';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LogDidIt } from '@/features/today/LogDidIt';
import { QuickLog } from '@/features/today/QuickLog';
import {
  MARK_STATUS,
  dayResult,
  dayRows,
  tomorrowFirst,
  type DayMark,
} from '@/features/review/dayReview';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * End of day — a grid, not a form.
 *
 * ── What the first version got wrong ────────────────────────────────────
 *
 * The sketch is one line per item with the three marks BESIDE it:
 *
 *     │  Strength — lower body   ✓ ✗ + │
 *
 * The first build put a full-width row of three third-width buttons UNDER
 * each title, which made a five-item day about five hundred points tall —
 * so a review meant to take twenty seconds had to be scrolled. The
 * justification was the 44pt touch floor, and the arithmetic does not
 * support it: three 44pt cells are 132 points, leaving 226 for the time
 * and the title on a 390pt phone. The sketch was always buildable as
 * drawn.
 *
 * ── Why the marks carry colour ──────────────────────────────────────────
 *
 * The three glyphs used to be identical in weight until tapped, so there
 * was no column to scan down and a marked day had no shape. Marked, each
 * column now has its own tone — kept, missed, swapped — which means a
 * person can look at a finished day and see what kind of day it was
 * without reading a word of it. That is the entire argument for a grid
 * over a list.
 */

const MARKS: { value: DayMark; glyph: string; label: string; tone: 'accent' | 'danger' | 'must' }[] =
  [
    { value: 'did', glyph: '✓', label: 'Did it', tone: 'accent' },
    { value: 'didnt', glyph: '✗', label: 'Didn’t', tone: 'danger' },
    { value: 'instead', glyph: '+', label: 'Did something else', tone: 'must' },
  ];

const SOFT = { accent: 'accentSoft', danger: 'dangerSoft', must: 'mustSoft' } as const;

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
      <View style={styles.head}>
        <AppText variant="label" color="textTertiary">
          End of day
        </AppText>
        <AppText variant="label" color="textTertiary">
          {formatDateLong(date).split(',')[0]}
        </AppText>
      </View>

      {rows.length === 0 ? (
        <View style={styles.block}>
          <AppText variant="heading">Nothing was on today.</AppText>
          <AppText variant="secondary">Anything you did anyway can still go on the day.</AppText>
          <LogDidIt date={date} />
        </View>
      ) : (
        <View style={[styles.grid, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          {rows.map((row, i) => (
            <View
              key={row.item.id}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
              ]}
            >
              <AppText variant="caption" color="textTertiary" style={styles.time} numeric>
                {formatTime(row.item.start)}
              </AppText>
              <AppText variant="body" style={styles.title}>
                {row.item.title}
              </AppText>
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
                        { borderLeftColor: theme.border },
                        on && {
                          backgroundColor: theme[SOFT[m.tone]],
                          borderColor: theme[m.tone],
                          borderLeftColor: theme[m.tone],
                        },
                      ]}
                    >
                      <AppText variant="body" color={on ? m.tone : 'textTertiary'}>
                        {m.glyph}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      {rows.length > 0 ? (
        <AppText variant="caption" color="textTertiary" style={styles.legend}>
          ✓ did it · ✗ didn’t · + did something else
        </AppText>
      ) : null}

      {/* The "+" column's own answer, opened only by using it. The habit
          chips are one tap for the things this person already does; the
          fuller entry underneath catches everything else. */}
      {instead ? (
        <View style={[styles.block, styles.ruled, { borderTopColor: theme.border }]}>
          <AppText variant="secondary">What did you do instead?</AppText>
          <QuickLog />
          <LogDidIt date={date} />
        </View>
      ) : null}

      {/* One line and a sparkline, on a rule. Not a chapter heading: a
          twenty-second close does not have sections. */}
      <View style={[styles.ruled, styles.resultRow, { borderTopColor: theme.border }]}>
        <AppText variant="body" style={styles.title}>
          {result.line}
        </AppText>
        {result.weekTotal > 0 ? (
          <View style={styles.spark}>
            <Sparkbars
              data={result.trend.map((value, i) => ({ label: addDays(date, i - 6), value }))}
              accessibilityLabel={`${result.weekDone} of ${result.weekTotal} across the last seven days`}
              fromZero
            />
          </View>
        ) : null}
      </View>
      {/* No percentage and no streak. A missed Tuesday is a missed
          Tuesday, not a reset to zero. */}

      {next ? (
        <View style={[styles.ruled, { borderTopColor: theme.border }]}>
          <AppText variant="label" color="textTertiary">
            Tomorrow
          </AppText>
          <View style={styles.nextRow}>
            <AppText variant="caption" color="textTertiary" style={styles.time} numeric>
              {formatTime(next.start)}
            </AppText>
            <AppText variant="body" style={styles.title}>
              {next.title}
            </AppText>
            <Pressable
              onPress={() => router.push('/(tabs)/plan')}
              accessibilityRole="button"
              accessibilityLabel={`Move ${next.title}`}
              accessibilityHint="Opens tomorrow so you can change the time."
              style={styles.move}
            >
              <AppText variant="caption" color="accent">
                Move
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Button title="Close the day" style={styles.close} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  block: { marginTop: Spacing.lg, gap: Spacing.sm },
  grid: {
    marginTop: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, gap: Spacing.sm },
  time: { minWidth: 52 },
  title: { flex: 1 },
  marks: { flexDirection: 'row' },
  mark: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  legend: { marginTop: Spacing.sm },
  ruled: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  spark: { minWidth: 96 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  move: { minHeight: 44, minWidth: 56, alignItems: 'flex-end', justifyContent: 'center' },
  close: { marginTop: Spacing.xl },
});
