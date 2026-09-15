import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { CAPACITY_LABEL, effectiveCapacity } from '@/features/planner/load';
import { reviewPeriod } from '@/features/review/period';
import {
  CELL_GLYPH,
  DAY_INITIALS,
  DAY_NAMES,
  NUDGE_MINUTES,
  cellSummary,
  hourLabel,
  nudgeCell,
  weekGrid,
  weekProposals,
  weekRangeLabel,
  type WeekCell,
} from '@/features/review/weekReview';
import { addDays, todayKey, weekStartOf } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * End of week — the grid, built as a grid.
 *
 * ── What the first version got wrong ────────────────────────────────────
 *
 * The sketch is a table: hours down the left, days across, a mark in every
 * cell, readable in one look. The first build rendered caption-size glyphs
 * floating in space with forty-eight points between rows and an almost
 * invisible dot for an empty cell — so nothing held the columns together
 * and it read as scattered text rather than a week.
 *
 * A grid needs a lattice. Cells now butt up against each other inside one
 * bordered block, rows are separated by a hairline rather than by air, and
 * the two weekend columns carry a faint tint so the shape of the week is
 * visible before a single mark is read. Twelve crosses in one row is an
 * argument that makes itself, and it only makes itself if the row reads as
 * a row.
 *
 * ── And the proposals are not cards ─────────────────────────────────────
 *
 * Three stacked cards with a heading and two buttons each is a great deal
 * of chrome for "6am Tuesday died twice". The sketch has them as bullets
 * with the actions inline, which is what they are: three short sentences
 * about the grid above, each with the one or two answers that exist.
 */

interface Selection {
  cell: WeekCell;
  col: number;
}

/** Saturday and Sunday, tinted so the week has a visible shape. */
const WEEKEND = [5, 6];

export default function WeekReview() {
  const router = useRouter();
  const theme = useTheme();
  const today = todayKey();

  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const profile = useAppStore((s) => s.profile);
  const weekCapacities = useAppStore((s) => s.weekCapacities);
  const applyWeeklyChanges = useAppStore((s) => s.applyWeeklyChanges);
  const setWeekCapacity = useAppStore((s) => s.setWeekCapacity);

  const period = useMemo(() => reviewPeriod(today), [today]);
  /** The week the changes land on — this one on a Monday, next one after. */
  const targetWeek = period.atWeekStart ? weekStartOf(today) : addDays(weekStartOf(today), 7);

  const capacity = useMemo(
    () =>
      effectiveCapacity({
        stated: profile?.capacity ?? 'steady',
        overrides: weekCapacities,
        plans,
        date: targetWeek,
      }).capacity,
    [profile?.capacity, weekCapacities, plans, targetWeek],
  );

  const grid = useMemo(() => weekGrid(plans, period.from, today), [plans, period.from, today]);
  const proposals = useMemo(
    () => weekProposals({ grid, plans, routines, capacity, today, forward: period.lookingForward }),
    [grid, plans, routines, capacity, today, period.lookingForward],
  );

  const [selected, setSelected] = useState<Selection | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const cellColor = (mark: WeekCell['mark']) =>
    mark === 'did'
      ? theme.accent
      : mark === 'didnt'
        ? theme.danger
        : mark === 'mixed'
          ? theme.must
          : theme.border;

  const nudge = (delta: number) => {
    if (!selected) return;
    const changes = nudgeCell(selected.cell, routines, delta);
    if (changes.length > 0) applyWeeklyChanges(changes);
    setSelected(null);
  };

  return (
    <Screen>
      <View style={styles.head}>
        <AppText variant="label" color="textTertiary">
          End of week
        </AppText>
        <AppText variant="label" color="textTertiary" numeric>
          {weekRangeLabel(period.from)}
        </AppText>
      </View>

      {grid.rows.length === 0 ? (
        <AppText variant="secondary" style={styles.block}>
          Nothing was on {period.lookingBack}, so there is no shape to read yet. Come back after a
          week with some of your plan in it.
        </AppText>
      ) : (
        <>
          <View style={[styles.grid, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={styles.gridRow}>
              <View style={[styles.hourCell, { borderRightColor: theme.border }]} />
              {DAY_INITIALS.map((letter, col) => (
                <View
                  key={`${letter}-${col}`}
                  style={[
                    styles.cell,
                    styles.headCell,
                    WEEKEND.includes(col) && { backgroundColor: theme.surfacePressed },
                  ]}
                >
                  <AppText variant="label" color="textTertiary">
                    {letter}
                  </AppText>
                </View>
              ))}
            </View>

            {grid.rows.map((row, r) => (
              <View key={row.hour}>
                {/* The hours nobody used, said rather than silently closed
                    up. Dropping them keeps the grid three rows instead of
                    nineteen; drawing them at zero height would make the
                    six hours between ten and four look like the one
                    between six and seven, on the screen whose entire point
                    is the shape of the week. */}
                {row.gapBefore > 0 ? (
                  <View
                    style={[
                      styles.gap,
                      { borderColor: theme.border, backgroundColor: theme.background },
                    ]}
                  >
                    <AppText variant="caption" color="textTertiary">
                      {row.gapBefore === 1 ? '1 hour' : `${row.gapBefore} hours`} with nothing on
                    </AppText>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.gridRow,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                    r === 0 && { borderTopColor: theme.text },
                  ]}
                >
                  <View style={[styles.hourCell, { borderRightColor: theme.border }]}>
                    <AppText variant="caption" color="textTertiary" numeric>
                      {row.label}
                    </AppText>
                  </View>
                  {row.cells.map((cell, col) => {
                  const open =
                    selected?.cell.date === cell.date && selected?.cell.hour === cell.hour;
                  const summary = cellSummary(cell);
                  return (
                    <Pressable
                      key={cell.date}
                      accessibilityRole="button"
                      accessibilityState={{ selected: open, disabled: !summary }}
                      accessibilityLabel={
                        summary
                          ? `${DAY_NAMES[col]} ${row.label}: ${summary}, ${MARK_WORDS[cell.mark]}`
                          : `${DAY_NAMES[col]} ${row.label}: nothing on`
                      }
                      onPress={() => (summary ? setSelected(open ? null : { cell, col }) : null)}
                      style={[
                        styles.cell,
                        WEEKEND.includes(col) && { backgroundColor: theme.surfacePressed },
                        open && { backgroundColor: theme.accentSoft },
                      ]}
                    >
                      <AppText variant="body" style={{ color: cellColor(cell.mark) }}>
                        {CELL_GLYPH[cell.mark]}
                      </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          <AppText variant="caption" color="textTertiary" style={styles.legend}>
            ✓ happened · ✗ didn&apos;t · ≈ partly · ○ to come
          </AppText>
          {/* The grid is the verdict. This is a caption on it, and at
              heading weight it was the loudest thing on the screen. */}
          <AppText variant="body" style={styles.count}>
            {grid.line}
          </AppText>

          {selected ? (
            <View style={[styles.ruled, { borderTopColor: theme.border }]}>
              <AppText variant="body">
                {DAY_NAMES[selected.col]} {hourLabel(selected.cell.hour)} —{' '}
                {cellSummary(selected.cell)}
              </AppText>
              <AppText variant="caption" color="textTertiary" style={styles.why}>
                Moving it here moves it every week — {period.lookingBack} is already over.
              </AppText>
              <View style={styles.actions}>
                <InlineAction label={`${NUDGE_MINUTES} min earlier`} onPress={() => nudge(-NUDGE_MINUTES)} />
                <InlineAction label={`${NUDGE_MINUTES} min later`} onPress={() => nudge(NUDGE_MINUTES)} />
              </View>
            </View>
          ) : (
            <AppText variant="caption" color="textTertiary" style={styles.count}>
              Tap anything on the grid to move it.
            </AppText>
          )}
        </>
      )}

      {/* Bullets with the actions inline, which is what they are: short
          sentences about the grid, each with the answers that exist. */}
      <View style={[styles.ruled, { borderTopColor: theme.border }]}>
        <AppText variant="label" color="textTertiary">
          What changes {period.lookingForward}
        </AppText>
        {proposals.map((p) => (
          <View key={p.id} style={styles.proposal}>
            <AppText variant="body">{p.line}</AppText>
            {p.id === 'capacity' ? (
              <AppText variant="caption" color="textTertiary">
                Now: {CAPACITY_LABEL[capacity].toLowerCase()}.
              </AppText>
            ) : null}
            <View style={styles.actions}>
              {p.actions.map((a) => (
                <InlineAction
                  key={a.id}
                  label={applied.includes(a.id) ? 'Done' : a.label}
                  disabled={applied.includes(a.id)}
                  onPress={() => {
                    if (a.capacity) setWeekCapacity(targetWeek, a.capacity);
                    if (a.changes?.length) applyWeeklyChanges(a.changes);
                    setApplied((prev) => [...prev, a.id]);
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* No score, no percentage, no streak. The grid is the verdict and
          it is a picture. */}
      <Button title="Close the week" style={styles.close} onPress={() => router.back()} />
    </Screen>
  );
}

/** A text action at the touch floor. A card per answer was too much wall. */
function InlineAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      style={[styles.action, { borderColor: disabled ? theme.border : theme.accent }]}
    >
      <AppText variant="caption" color={disabled ? 'textTertiary' : 'accent'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const MARK_WORDS: Record<WeekCell['mark'], string> = {
  did: 'happened',
  didnt: 'did not happen',
  mixed: 'some of it happened',
  ahead: 'still to come',
  empty: 'nothing on',
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  block: { marginTop: Spacing.lg },
  grid: {
    marginTop: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  // No gap anywhere: cells butt together so the columns read as columns.
  gridRow: { flexDirection: 'row', alignItems: 'stretch' },
  /*
    A break in the table, not a row of it.

    Painted in the PAGE colour rather than the grid's surface, so it reads
    as the table being interrupted — which is exactly what it is. The first
    version used the surface colour and looked like a white strip slicing
    the tinted weekend columns, which reads as a bug rather than as time
    passing.
  */
  gap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  hourCell: {
    minWidth: 46,
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  cell: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headCell: { minHeight: 28 },
  legend: { marginTop: Spacing.sm },
  count: { marginTop: Spacing.md },
  ruled: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  why: { marginTop: Spacing.xs },
  proposal: { marginTop: Spacing.lg, gap: Spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  action: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
  },
  close: { marginTop: Spacing.xl },
});
