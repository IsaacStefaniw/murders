import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  CARDIO_ACTIVITIES,
  EFFORT_DESCRIPTION,
  EFFORT_LABEL,
  cardioActivity,
  isVigorous,
  type CardioEffort,
} from '@/features/training/cardio';
import { useAppStore } from '@/state/store';

/**
 * "Logging a jog or row or non-weights activity."
 *
 * Three taps and a number: what, how long, how hard. Distance is optional
 * and only offered where the activity has one, because a required field
 * nobody knows the answer to is how a log gets abandoned halfway.
 *
 * Effort is asked in words rather than in heart-rate zones, and the four
 * choices carry the talk test underneath them. It is the one thing here
 * the app genuinely cannot infer and the one thing that changes what the
 * session was worth — a 40-minute easy jog and 40 minutes of intervals are
 * not the same week, and the published activity table says so by paying
 * vigorous minutes double.
 */

/** Rough durations. Nobody times a jog to the minute, and it does not matter. */
const DURATIONS = [15, 20, 30, 45, 60, 90];
const EFFORTS: CardioEffort[] = ['easy', 'steady', 'hard', 'allOut'];

export function LogCardio({ date, onDone }: { date?: string; onDone?: () => void }) {
  const logCardio = useAppStore((s) => s.logCardio);
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState('run');
  const [durationMin, setDurationMin] = useState(30);
  const [distance, setDistance] = useState('');
  const [effort, setEffort] = useState<CardioEffort>('steady');
  const [saved, setSaved] = useState<string | null>(null);

  const def = cardioActivity(activity);
  const km = Number.parseFloat(distance);
  const hasDistance = Number.isFinite(km) && km > 0;

  const commit = () => {
    logCardio({
      date,
      activity,
      durationMin,
      distanceKm: hasDistance ? km : undefined,
      effort,
    });
    setSaved(`${def?.label ?? activity}, ${durationMin} min`);
    setDistance('');
    setOpen(false);
    onDone?.();
  };

  if (!open) {
    return (
      <View>
        {saved ? (
          <AppText variant="caption" color="success" style={styles.saved}>
            {saved} — logged. It counts the same as a session the app planned.
          </AppText>
        ) : null}
        <Button
          title="Log a run, row or ride"
          variant="secondary"
          hint="Record cardio: what you did, how long, and how hard."
          onPress={() => setOpen(true)}
        />
      </View>
    );
  }

  return (
    <Card>
      <AppText variant="heading">What did you do?</AppText>
      <View style={styles.chips}>
        {CARDIO_ACTIVITIES.map((a) => (
          <Chip
            key={a.id}
            label={a.label}
            selected={activity === a.id}
            onPress={() => setActivity(a.id)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          Roughly how long?
        </AppText>
        <View style={styles.chips}>
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} min`}
              selected={durationMin === d}
              onPress={() => setDurationMin(d)}
            />
          ))}
        </View>
      </View>

      {def?.unit === 'km' ? (
        <View style={styles.section}>
          <Field
            label="How far, in kilometres"
            hint="Optional. Leave it blank if you did not measure."
            value={distance}
            onChangeText={setDistance}
            keyboardType="decimal-pad"
            unit="km"
            width={90}
            placeholder="5"
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          How hard was it?
        </AppText>
        <View style={styles.chips}>
          {EFFORTS.map((e) => (
            <Chip
              key={e}
              label={EFFORT_LABEL[e]}
              hint={EFFORT_DESCRIPTION[e]}
              selected={effort === e}
              onPress={() => setEffort(e)}
            />
          ))}
        </View>
        <AppText variant="caption" color="textSecondary" style={styles.note}>
          {EFFORT_DESCRIPTION[effort]}.{' '}
          {isVigorous(effort)
            ? 'Counts double towards the weekly activity guideline, as the published table has it.'
            : 'Counts once towards the weekly activity guideline — which is where most of the evidence sits, so this is not the lesser option.'}
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button title="Log it" onPress={commit} />
        <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  section: { marginTop: Spacing.md },
  note: { marginTop: Spacing.xs },
  actions: { marginTop: Spacing.md, gap: Spacing.xs },
  saved: { marginBottom: Spacing.xs },
});
