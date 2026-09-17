import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Spacing } from '@/constants/theme';
import { dismissedToday, pendingAsk } from '@/features/health/dailyAsk';
import { formatTime, toHHMM, toMinutes, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The one question worth asking today, and a way to answer it.
 *
 * ── What was missing ────────────────────────────────────────────────────
 *
 * `dailyAsk.ts` decides what is worth asking and how often — two questions
 * at most, only on days the app cannot get the answer itself, and usually
 * none. It has been written, reasoned and tested, and no screen has ever
 * called it.
 *
 * The consequence is sharper than an unwired module. Sleep REGULARITY is
 * the strongest sleep predictor in the instrument — Windred and colleagues
 * found it beat duration across 60,977 people and ten million hours of
 * accelerometry — `sleepTiming.ts` computes it, `pace.ts` scores it, and
 * `recordSleepNight` is in the store. Nothing in the app called that
 * either. There was no way for a person to enter a bed time, so the
 * component could never populate for anybody without a watch.
 *
 * ── Why chips and not a keyboard ────────────────────────────────────────
 *
 * The two clock times are the whole point, and they have to be easier to
 * give than to skip. A numeric field at seven in the morning is four taps
 * and a mistyped colon; half-hour chips centred on this person's own
 * stated window are one tap each. The window moves with them, so somebody
 * who sleeps at one in the morning is not scrolling past ten o'clock.
 *
 * It is deliberately coarse. Half an hour is well inside the noise of
 * remembering when you fell asleep, and a precision the person cannot
 * supply is a precision the instrument should not pretend to.
 */

/** Half-hour steps either side of their own usual time. */
const SPREAD_MIN = 120;
const STEP_MIN = 30;

const RATINGS = ['excellent', 'good', 'fair', 'poor'] as const;

function around(centre: string): number[] {
  const mid = toMinutes(centre);
  const out: number[] = [];
  for (let d = -SPREAD_MIN; d <= SPREAD_MIN; d += STEP_MIN) out.push((mid + d + 1440) % 1440);
  return out;
}

export function DailyAsk() {
  const profile = useAppStore((s) => s.profile);
  const sleepNights = useAppStore((s) => s.sleepNights);
  const metrics = useAppStore((s) => s.metrics);
  const dismissedAsks = useAppStore((s) => s.dismissedAsks);
  const dismissAsk = useAppStore((s) => s.dismissAsk);
  const interviewAnswers = useAppStore((s) => s.interviewAnswers);
  const recordSleepNight = useAppStore((s) => s.recordSleepNight);
  const answerDeferredQuestion = useAppStore((s) => s.answerDeferredQuestion);

  const today = todayKey();
  const [bed, setBed] = useState<number | null>(null);

  // The same call Today's arbiter makes, from the same persisted
  // dismissals. When these diverged, "Not today" left the attention slot
  // claimed and empty — see `pendingAsk`.
  const ask = useMemo(
    () =>
      pendingAsk(
        {
          today,
          nightsRecorded: sleepNights.map((n) => n.date),
          metrics,
          lastSelfRatedHealth: interviewAnswers.selfRatedHealthAt as string | undefined,
        },
        dismissedToday(dismissedAsks, today),
      ),
    [today, sleepNights, metrics, interviewAnswers, dismissedAsks],
  );

  if (!ask || !profile) return null;

  const skip = () => dismissAsk(ask.id, today);

  return (
    <Card style={styles.card}>
      <AppText variant="heading">{ask.prompt}</AppText>
      {ask.why ? (
        <AppText variant="caption" color="textTertiary" style={styles.why}>
          {ask.why}
        </AppText>
      ) : null}

      {ask.id === 'sleepTiming' ? (
        <View style={styles.block}>
          <AppText variant="label" color="textSecondary">
            {bed === null ? 'Asleep around' : 'And awake around'}
          </AppText>
          <View style={styles.chips}>
            {around(bed === null ? profile.sleepTime : profile.wakeTime).map((min) => (
              <Chip
                key={min}
                label={formatTime(toHHMM(min))}
                onPress={() => {
                  if (bed === null) {
                    setBed(min);
                    return;
                  }
                  recordSleepNight(bed, min, today);
                  setBed(null);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {ask.id === 'selfRatedHealth' ? (
        <View style={styles.chips}>
          {RATINGS.map((r) => (
            <Chip
              key={r}
              label={r[0].toUpperCase() + r.slice(1)}
              onPress={() => {
                answerDeferredQuestion('selfRatedHealth', r);
                // Asked about once a month, so the app has to remember when.
                answerDeferredQuestion('selfRatedHealthAt', today);
              }}
            />
          ))}
        </View>
      ) : null}

      <Button title="Not today" variant="ghost" style={styles.block} onPress={skip} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: Spacing.md },
  why: { marginTop: Spacing.xs },
  block: { marginTop: Spacing.md, gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
});
