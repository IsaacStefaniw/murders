import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Disclosure } from '@/components/disclosure';
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
  dayAlsoHeld,
  dayTold,
  reviewableDay,
  tomorrowFirst,
  unresolvedRows,
  type DayMark,
} from '@/features/review/dayReview';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * End of day — the gap, then the handoff.
 *
 * ── What this screen is FOR ─────────────────────────────────────────────
 *
 * Three jobs were competing and only one of them was the person's:
 *
 *   capture   the adaptation engine needs to know what happened
 *   closure   the person needs to put the day down
 *   setup     hand them tomorrow
 *
 * The first version optimised entirely for capture — a grid of every item
 * with three marks each — and capture is the APP's need. Nobody opens
 * something at half past nine to feed a scheduler. Dressed as a review, a
 * chore is still a chore, which is why it read as a form however it was
 * laid out.
 *
 * Worse, it was capture the app did not need: Today marks items as they
 * happen, so by evening most of the day is already answered and the screen
 * was handing all of it back. A person who ticked three things off at the
 * time and gets all five returned at 9pm has learned the app was not
 * listening.
 *
 * ── So the order is inverted ────────────────────────────────────────────
 *
 * 1. The day, told back — closure, first, in titles rather than a count.
 * 2. Only what is still unanswered, which on most days is nothing.
 * 3. Tomorrow, which is the reason to open this at all.
 *
 * On a day that was kept up with, this screen is two sentences and a
 * button. That is the correct amount of screen for a day that went fine,
 * and the grid could never be that.
 *
 * ── One tap for the common answer ───────────────────────────────────────
 *
 * Where several things are open, the usual truth is "yeah, all of that
 * happened". That is one button, not six taps. It is an assertion the
 * person makes rather than an inference the app draws, so it records at
 * full confidence like any other answer.
 */

/** The three answers, in the order a person reaches for them. No selected
 *  state and no tones: only unanswered rows render here, and a row leaves
 *  the list the moment it is answered. */
const MARKS: { value: DayMark; glyph: string; label: string }[] = [
  { value: 'did', glyph: '✓', label: 'Did it' },
  { value: 'didnt', glyph: '✗', label: 'Didn’t' },
  { value: 'instead', glyph: '+', label: 'Did something else' },
];

export default function DayReview() {
  const router = useRouter();
  const theme = useTheme();

  const plans = useAppStore((s) => s.plans);
  const today = todayKey();

  /**
   * Which day this is, and the arrows to leave it by.
   *
   * ── Isaac, on his own week ────────────────────────────────────────────
   *
   * *"I can't remember what was or wasn't included but I need to check."*
   * (`docs/NEXT_SESSION.md` §2.2.) Today was today-only, and the backdating
   * work already shipped is a different thing — it files something under an
   * earlier date FROM today's screen; it never let him go and look at
   * Tuesday.
   *
   * This screen was already the right one for the job and was simply
   * pinned to `todayKey()`. It tells the day back, says what else the day
   * held, and takes an answer on anything still open — which is exactly
   * "step back and adjust". So it takes a date now, and Today's tab stays
   * one job rather than growing a date picker.
   */
  const { date: requested } = useLocalSearchParams<{ date?: string }>();
  const setItemStatus = useAppStore((s) => s.setItemStatus);

  // The clamps live in features/review/dayReview.ts, because which dates
  // are real is a rule rather than a layout and every one of its edges is
  // a way to show somebody a day that does not exist.
  const { date, canGoBack, isToday } = useMemo(
    () => reviewableDay({ requested, today, plans }),
    [requested, today, plans],
  );
  const step = (days: number) =>
    router.setParams({ date: addDays(date, days) } as never);

  const rows = useMemo(() => dayRows(plans[date]), [plans, date]);
  const open = useMemo(() => unresolvedRows(plans[date]), [plans, date]);
  const told = useMemo(() => dayTold(rows), [rows]);
  /**
   * What the day held that was not on the plan.
   *
   * Without this the screen whose entire job is the truth about today
   * could not see a logged drink — and worse, reported the urge protocol
   * as Done because its plan item had been ticked earlier in the evening.
   * A review run as the target persona logged a drink at 21:50 and was
   * told, four minutes later, that the thing designed to prevent it had
   * happened.
   */
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const alsoHeld = useMemo(
    () => dayAlsoHeld(behaviourEvents, behaviourIntentions, date, isToday),
    [behaviourEvents, behaviourIntentions, date, isToday],
  );
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
      <View style={styles.headRow}>
        <AppText variant="label" color="textTertiary">
          {isToday ? 'End of day' : 'That day'}
        </AppText>
        <View style={styles.stepper}>
          <Pressable
            onPress={canGoBack ? () => step(-1) : undefined}
            disabled={!canGoBack}
            accessibilityRole="button"
            accessibilityLabel="The day before"
            // Disabled rather than hidden: an arrow that vanishes at the
            // end of the record leaves somebody tapping empty space and
            // wondering whether they missed it.
            style={styles.arrow}
          >
            <AppText variant="body" color={canGoBack ? 'accent' : 'textTertiary'}>
              ‹
            </AppText>
          </Pressable>
          <AppText variant="label" color="textTertiary" style={styles.stepperDate}>
            {isToday ? formatDateLong(date).split(',')[0] : formatDateLong(date)}
          </AppText>
          <Pressable
            onPress={isToday ? undefined : () => step(1)}
            disabled={isToday}
            accessibilityRole="button"
            accessibilityLabel="The day after"
            style={styles.arrow}
          >
            <AppText variant="body" color={isToday ? 'textTertiary' : 'accent'}>
              ›
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Closure first. A count is not how anybody puts a day down — and
          what happened gets the large type while what didn't sits under
          it, the same split the week screen makes between its finding and
          its count. */}
      <AppText variant="title" style={styles.told}>
        {told.headline}
      </AppText>
      {/* Counted, never judged. The aftermath flow owns the response; this
          screen's job is only to not lie by omission. */}
      {alsoHeld ? (
        <AppText variant="secondary" color="textSecondary">
          {alsoHeld}
        </AppText>
      ) : null}
      {told.note ? (
        <AppText variant="secondary" style={styles.note}>
          {told.note}
        </AppText>
      ) : null}

      {open.length > 0 ? (
        <View style={styles.block}>
          <AppText variant="label" color="textTertiary">
            {open.length === 1 ? 'One thing left to say' : `${open.length} things left to say`}
          </AppText>

          <View style={[styles.grid, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            {open.map((row, i) => (
              <View
                key={row.item.id}
                style={[
                  styles.row,
                  i > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border,
                  },
                ]}
              >
                <AppText variant="caption" color="textTertiary" style={styles.time} numeric>
                  {formatTime(row.item.start)}
                </AppText>
                <AppText variant="body" style={styles.grow}>
                  {row.item.title}
                </AppText>
                <View style={styles.marks}>
                  {MARKS.map((m) => (
                    <Pressable
                      key={m.value}
                      onPress={() => mark(row.item.id, m.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`${row.item.title}: ${m.label}`}
                      style={[styles.mark, { borderLeftColor: theme.border }]}
                    >
                      <AppText variant="body" color="textTertiary">
                        {m.glyph}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* The usual truth, in one tap rather than six. */}
          {open.length > 1 ? (
            <Button
              title="All of that happened"
              variant="secondary"
              hint="Marks every remaining item as done."
              onPress={() => open.forEach((r) => mark(r.item.id, 'did'))}
            />
          ) : null}

          <AppText variant="caption" color="textTertiary">
            ✓ did it · ✗ didn’t · + did something else
          </AppText>
        </View>
      ) : null}

      {/* Opened by using the third column, or on purpose from the bottom.
          Never sitting there as a wall. */}
      {instead ? (
        <View style={styles.block}>
          <AppText variant="secondary">What did you do instead?</AppText>
          <QuickLog />
          <LogDidIt date={date} />
        </View>
      ) : null}

      {/* Tomorrow is the reason to open this, so it gets the weight — on
          TODAY. Looking back at a Tuesday, "tomorrow starts with" would
          name the Wednesday that has already happened, which is a sentence
          about the past in the future tense. */}
      {isToday && next ? (
        <View style={[styles.ruled, { borderTopColor: theme.border }]}>
          <AppText variant="label" color="textTertiary">
            Tomorrow starts with
          </AppText>
          <View style={styles.nextRow}>
            <AppText variant="caption" color="textTertiary" style={styles.time} numeric>
              {formatTime(next.start)}
            </AppText>
            <AppText variant="heading" style={styles.grow}>
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

      {/* "Close the day" is what you do to today. On a Tuesday you went
          back to look at, the button is a way out, not a ritual. */}
      <Button
        title={isToday ? 'Close the day' : 'Done looking'}
        style={styles.close}
        onPress={() => router.back()}
      />

      {/* The week, and anything unplanned — both real, neither the point of
          a nightly close. No percentage and no streak: a missed Tuesday is
          a missed Tuesday, not a reset to zero. */}
      <View style={styles.footer}>
        <Disclosure title="How the week is going">
          <View style={styles.resultRow}>
            <AppText variant="body" style={styles.grow}>
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
        </Disclosure>
        {/* Same slip as "Also logged today", found in the same browser run
            one line below it: this read "something else today" under a
            heading saying TUESDAY, OCTOBER 6. `LogDidIt` already takes the
            date, so the capture was filing correctly against the day being
            viewed — only the label was wrong. */}
        {!instead ? (
          <Disclosure title={isToday ? 'I did something else today' : 'I did something else'}>
            <QuickLog />
            <LogDidIt date={date} />
          </Disclosure>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepperDate: { minWidth: 96, textAlign: 'right' },
  /** Apple's minimum, on a control somebody taps repeatedly. */
  arrow: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  told: { marginTop: Spacing.lg },
  note: { marginTop: Spacing.xs },
  block: { marginTop: Spacing.xl, gap: Spacing.md },
  grid: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: Spacing.md, gap: Spacing.sm },
  time: { minWidth: 52 },
  grow: { flex: 1 },
  marks: { flexDirection: 'row' },
  mark: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  ruled: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  move: { minHeight: 44, minWidth: 56, alignItems: 'flex-end', justifyContent: 'center' },
  close: { marginTop: Spacing.xl },
  footer: { marginTop: Spacing.xl, gap: Spacing.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  spark: { minWidth: 96 },
});
