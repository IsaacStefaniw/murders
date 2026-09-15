import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
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
 * End of week — the grid, from Isaac's sketch.
 *
 * Hours down the left, days across, a mark in every cell. Twelve ✗ in one
 * row is an argument that makes itself, where "you completed 58% of your
 * activities" is not. See `features/review/weekReview.ts` for what the
 * grid refuses to do and why the proposals underneath are derived from it
 * rather than offered blind.
 */

/** A cell the person has opened, so the grid can be tapped and moved. */
interface Selection {
  cell: WeekCell;
  col: number;
}

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
  const targetWeek = period.atWeekStart
    ? weekStartOf(today)
    : addDays(weekStartOf(today), 7);

  /** The gear the planner will actually use, not the one at signup. */
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

  const grid = useMemo(
    () => weekGrid(plans, period.from, today),
    [plans, period.from, today],
  );
  const proposals = useMemo(
    () =>
      weekProposals({
        grid,
        plans,
        routines,
        capacity,
        today,
        forward: period.lookingForward,
      }),
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
          : theme.textTertiary;

  const nudge = (delta: number) => {
    if (!selected) return;
    const changes = nudgeCell(selected.cell, routines, delta);
    if (changes.length > 0) applyWeeklyChanges(changes);
    setApplied((a) => [...a, `nudge-${selected.cell.date}-${selected.cell.hour}`]);
    setSelected(null);
  };

  return (
    <Screen>
      <AppText variant="label" color="textTertiary">
        End of week
      </AppText>
      <AppText variant="title">{weekRangeLabel(period.from)}</AppText>

      {grid.rows.length === 0 ? (
        <Card style={styles.gap}>
          <AppText variant="secondary">
            Nothing was on {period.lookingBack}, so there is no shape to read yet. Come back after a
            week with some of your plan in it.
          </AppText>
        </Card>
      ) : (
        <View style={styles.gap}>
          {/* Outside a Card on purpose: the seven columns need every point
              of width the screen has to clear the 44pt touch floor. */}
          <View style={styles.headRow}>
            <View style={styles.hourLabel} />
            {DAY_INITIALS.map((letter, col) => (
              <AppText
                key={`${letter}-${col}`}
                variant="caption"
                color="textTertiary"
                style={styles.headCell}
              >
                {letter}
              </AppText>
            ))}
          </View>

          {grid.rows.map((row) => (
            <View key={row.hour} style={styles.gridRow}>
              <AppText variant="caption" color="textTertiary" style={styles.hourLabel}>
                {row.label}
              </AppText>
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
                      open && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                    ]}
                  >
                    <AppText variant="body" style={{ color: cellColor(cell.mark) }}>
                      {CELL_GLYPH[cell.mark]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <AppText variant="caption" color="textTertiary" style={styles.legend}>
            ✓ happened · ✗ didn&apos;t · ½ some of it · ○ still to come
          </AppText>
          <AppText variant="heading" style={styles.gap}>
            {grid.line}
          </AppText>

          {selected ? (
            <Card style={styles.gap}>
              <AppText variant="secondary">
                {DAY_NAMES[selected.col]} {hourLabel(selected.cell.hour)} —{' '}
                {cellSummary(selected.cell)}
              </AppText>
              <AppText variant="caption" color="textTertiary" style={styles.tapNote}>
                Moving it here moves it every week — {period.lookingBack} is already over.
              </AppText>
              <View style={styles.actions}>
                <Button
                  title={`${NUDGE_MINUTES} min earlier`}
                  variant="secondary"
                  style={styles.action}
                  onPress={() => nudge(-NUDGE_MINUTES)}
                />
                <Button
                  title={`${NUDGE_MINUTES} min later`}
                  variant="secondary"
                  style={styles.action}
                  onPress={() => nudge(NUDGE_MINUTES)}
                />
              </View>
            </Card>
          ) : (
            <AppText variant="caption" color="textTertiary">
              Tap anything on the grid to move it.
            </AppText>
          )}
        </View>
      )}

      <SectionHeader title={`What changes ${period.lookingForward}`} />
      <View style={styles.stack}>
        {proposals.map((p) => (
          <Card key={p.id}>
            <AppText variant="body">{p.line}</AppText>
            <View style={styles.actions}>
              {p.actions.map((a) => {
                const done = applied.includes(a.id);
                return (
                  <Button
                    key={a.id}
                    title={done ? 'Done' : a.label}
                    variant="secondary"
                    disabled={done}
                    style={styles.action}
                    onPress={() => {
                      if (a.capacity) setWeekCapacity(targetWeek, a.capacity);
                      if (a.changes?.length) applyWeeklyChanges(a.changes);
                      setApplied((prev) => [...prev, a.id]);
                    }}
                  />
                );
              })}
            </View>
            {p.id === 'capacity' ? (
              <AppText variant="caption" color="textTertiary" style={styles.tapNote}>
                Now: {CAPACITY_LABEL[capacity].toLowerCase()}.
              </AppText>
            ) : null}
          </Card>
        ))}
      </View>

      {/* No score, no percentage, no streak — the same refusal the day
          review makes. The grid is the verdict and it is a picture. */}
      <Button title="Close the week" style={styles.close} onPress={() => router.back()} />
    </Screen>
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
  gap: { marginTop: Spacing.md },
  stack: { gap: Spacing.sm },
  // No gap between columns: seven cells and a gutter have 358 points to
  // share on a 390pt phone, and 4pt of air in each seam costs 4pt of touch
  // target. The cells read as a grid without it — measured at 45x44.
  headRow: { flexDirection: 'row', alignItems: 'center' },
  headCell: { flex: 1, textAlign: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  hourLabel: { minWidth: 40 },
  cell: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: Radius.sm,
  },
  legend: { marginTop: Spacing.md },
  tapNote: { marginTop: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  action: { flexGrow: 1, flexBasis: 140 },
  close: { marginTop: Spacing.xl },
});
