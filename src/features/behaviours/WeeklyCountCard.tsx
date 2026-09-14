import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import {
  COUNTABLE,
  countFor,
  lastWeekStart,
  lineFor,
} from '@/features/behaviours/weekly';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { BehaviourIntention } from '@/types/domain';

/**
 * "How many last week?" — the whole interaction.
 *
 * Built for somebody with about four seconds. The common answers are chips,
 * because a numeric keyboard on a phone is a three-step operation (focus,
 * type, dismiss) for a number that is nearly always under fifteen. Tapping
 * a chip is one. The chips go to 20 and then hand over to a stepper for
 * anything higher, so the fast path stays fast without capping the honest
 * answer.
 *
 * It asks about the week that has FINISHED. A running count of the week
 * you are in is the daily tally this app refuses — see weekly.ts — and it
 * is also just a worse measurement, because the week is not over.
 *
 * Answered once, it collapses to the figure and the guideline. It does not
 * nag, it does not celebrate a low number, and it never draws a line.
 */

const QUICK = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

export function WeeklyCountCard({ intention }: { intention: BehaviourIntention }) {
  const spec = COUNTABLE[intention.behaviour];
  const weeklyCounts = useAppStore((s) => s.weeklyCounts);
  const setWeeklyCount = useAppStore((s) => s.setWeeklyCount);
  const week = useMemo(() => lastWeekStart(todayKey()), []);
  const saved = countFor(weeklyCounts, intention.behaviour, week);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | null>(null);

  if (!spec) return null;
  const info = behaviourInfo(intention.behaviour);

  const commit = (n: number) => {
    setWeeklyCount(intention.behaviour, week, n);
    setDraft(null);
    setEditing(false);
  };

  if (saved && !editing) {
    return (
      <Card>
        <AppText variant="label" color="textSecondary">
          {info.label} · last week
        </AppText>
        <AppText variant="secondary" style={styles.gap}>
          {lineFor(intention.behaviour, saved.count)}
        </AppText>
        <Button
          title="Change it"
          variant="ghost"
          style={styles.gap}
          hint="One number, for the week that finished."
          onPress={() => {
            setDraft(saved.count);
            setEditing(true);
          }}
        />
      </Card>
    );
  }

  const current = draft ?? 0;
  return (
    <Card>
      <AppText variant="heading">{spec.prompt}</AppText>
      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        One number for the week that just finished. It is never charted, never
        turned into a streak, and nothing here counts days.
      </AppText>
      <View style={styles.chips}>
        {QUICK.map((n) => (
          <Chip
            key={n}
            label={String(n)}
            selected={draft === n}
            onPress={() => commit(n)}
          />
        ))}
      </View>
      <View style={styles.stepper}>
        <Button title="−" variant="secondary" onPress={() => setDraft(Math.max(0, current - 1))} hint="One fewer" />
        <AppText variant="title" style={styles.count}>
          {current}
        </AppText>
        <Button title="+" variant="secondary" onPress={() => setDraft(current + 1)} hint="One more" />
        <Button title="Save" onPress={() => commit(current)} hint={`Records ${current} for last week.`} />
      </View>
      {saved ? (
        <Button title="Leave it as it was" variant="ghost" style={styles.gap} onPress={() => setEditing(false)} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  count: { minWidth: 44, textAlign: 'center' },
});
