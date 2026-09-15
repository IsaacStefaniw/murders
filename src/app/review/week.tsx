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
  weekLead,
  weekProposals,
  weekRangeLabel,
  type WeekAction,
  type WeekCell,
  type WeekProposal,
} from '@/features/review/weekReview';
import { addDays, todayKey, weekStartOf } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * End of week — the finding, the decision, then the evidence.
 *
 * ── What this screen is FOR ─────────────────────────────────────────────
 *
 * Three jobs, and the first build put them in the wrong order:
 *
 *   finding    the app can see three Tuesdays at once; a person cannot
 *   decision   one or two changes to next week, made here or not at all
 *   evidence   the grid, so the finding can be checked rather than trusted
 *
 * It opened with the grid — seven columns, a legend, a count — and put the
 * sentence the app had already worked out below all of it. That asks
 * somebody to do analysis the app has done, and then does it for them
 * anyway, further down, where a tired person on a Sunday night may never
 * reach.
 *
 * `deadSlots` knows "6am Tuesday died twice" before a single cell renders.
 * Saying it first costs nothing and is the whole reason to keep a week of
 * data: anyone can see their own Tuesday; nobody can see three Tuesdays at
 * once.
 *
 * ── So the grid keeps its job and loses its position ────────────────────
 *
 * It is still the thing that makes the claim believable — twelve crosses
 * in a row is an argument that makes itself — but it is now underneath the
 * claim, labelled as what it is, with the cells the finding was read off
 * ringed. Claim and proof in one look, rather than a table and a homework
 * question.
 *
 * The count moves too. "8 of 14 things happened" is context, not a
 * verdict, and it was reading as a verdict at the top of a screen. It sits
 * under the headline at secondary weight, where a fact belongs.
 *
 * ── What it deliberately does not do ────────────────────────────────────
 *
 * No score, no percentage, no streak, and no ranking of days. The capacity
 * dial stays last: it is a standing question about next week rather than
 * anything this week said, and putting a standing question first is how a
 * screen stops having a point.
 */

interface Selection {
  cell: WeekCell;
  col: number;
}

/** Saturday and Sunday, tinted so the week has a visible shape. */
const WEEKEND = [5, 6];

/** The outline drawn around the cells a finding was read off. */
const RING = 2;

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
  const lead = useMemo(
    () => weekLead(grid, proposals, period.lookingBack),
    [grid, proposals, period.lookingBack],
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

  const take = (a: WeekAction) => {
    if (a.capacity) setWeekCapacity(targetWeek, a.capacity);
    if (a.changes?.length) applyWeeklyChanges(a.changes);
    setApplied((prev) => [...prev, a.id]);
  };

  const actionRow = (p: WeekProposal) => (
    <View style={styles.actions}>
      {p.actions.map((a) => (
        <InlineAction
          key={a.id}
          label={applied.includes(a.id) ? 'Done' : a.label}
          disabled={applied.includes(a.id)}
          onPress={() => take(a)}
        />
      ))}
    </View>
  );

  /** The cells the headline was read off, so the ring knows where to go. */
  const focused = useMemo(() => {
    const set = new Set<string>();
    for (const f of lead.proposal?.focus ?? []) set.add(`${f.col}|${f.hour}`);
    return set;
  }, [lead.proposal]);

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

      {/* The finding first. The app can see three Tuesdays at once; this is
          the one thing on the screen a person could not work out alone. */}
      <AppText variant="title" style={styles.headline}>
        {lead.headline}
      </AppText>
      {lead.under ? (
        <AppText variant="secondary" style={styles.under}>
          {lead.under}
        </AppText>
      ) : null}

      {/* And the decision it implies, before the evidence rather than after
          it. Nobody scrolls past a table to find out what to do. */}
      {lead.proposal ? actionRow(lead.proposal) : null}

      {grid.rows.length === 0 ? (
        /* The headline has already said nothing was on. This is the one
           thing left worth saying: when to come back. */
        <AppText variant="secondary" style={styles.block}>
          There is no shape to read yet. Come back after a week with some of your plan in it.
        </AppText>
      ) : (
        <>
          <View style={[styles.ruled, { borderTopColor: theme.border }]}>
            <AppText variant="label" color="textTertiary">
              {lead.proposal ? 'Where that came from' : 'How the week went'}
            </AppText>
          </View>

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
                    /* One outline around the run, not a box around each
                       cell of it. Seven adjacent 2pt rings double up at
                       every join and read as seven findings, which is
                       the exact misreading the grouped finding exists to
                       stop. Edges are drawn only where the run ends. */
                    const ring = focused.has(`${col}|${row.hour}`);
                    const ringEdge = ring
                      ? {
                          borderTopWidth: RING,
                          borderBottomWidth: RING,
                          borderLeftWidth: focused.has(`${col - 1}|${row.hour}`) ? 0 : RING,
                          borderRightWidth: focused.has(`${col + 1}|${row.hour}`) ? 0 : RING,
                          borderColor: theme.text,
                        }
                      : null;
                    return (
                      <Pressable
                        key={cell.date}
                        accessibilityRole="button"
                        accessibilityState={{ selected: open, disabled: !summary }}
                        accessibilityLabel={
                          summary
                            ? `${DAY_NAMES[col]} ${row.label}: ${summary}, ${MARK_WORDS[cell.mark]}${
                                ring ? ', the one above' : ''
                              }`
                            : `${DAY_NAMES[col]} ${row.label}: nothing on`
                        }
                        onPress={() => (summary ? setSelected(open ? null : { cell, col }) : null)}
                        style={[
                          styles.cell,
                          WEEKEND.includes(col) && { backgroundColor: theme.surfacePressed },
                          /* The claim, pointing at itself. A finding you
                             have to hunt for in a 7-column table is one
                             most people take on trust or skip. */
                          ringEdge,
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
                <InlineAction
                  label={`${NUDGE_MINUTES} min earlier`}
                  onPress={() => nudge(-NUDGE_MINUTES)}
                />
                <InlineAction
                  label={`${NUDGE_MINUTES} min later`}
                  onPress={() => nudge(NUDGE_MINUTES)}
                />
              </View>
            </View>
          ) : (
            <AppText variant="caption" color="textTertiary" style={styles.count}>
              Tap anything on the grid to move it.
            </AppText>
          )}
        </>
      )}

      {/* Everything the headline did not take. Bullets with the actions
          inline, which is what they are: short sentences about the grid,
          each with the answers that exist. */}
      {lead.rest.length > 0 ? (
        <View style={[styles.ruled, { borderTopColor: theme.border }]}>
          <AppText variant="label" color="textTertiary">
            What else changes {period.lookingForward}
          </AppText>
          {lead.rest.map((p) => (
            <View key={p.id} style={styles.proposal}>
              <AppText variant="body">{p.line}</AppText>
              {p.id === 'capacity' ? (
                <AppText variant="caption" color="textTertiary">
                  Now: {CAPACITY_LABEL[capacity].toLowerCase()}.
                </AppText>
              ) : null}
              {actionRow(p)}
            </View>
          ))}
        </View>
      ) : null}

      {/* No score, no percentage, no streak. */}
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
  headline: { marginTop: Spacing.lg },
  under: { marginTop: Spacing.xs },
  block: { marginTop: Spacing.lg },
  grid: {
    marginTop: Spacing.md,
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
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
