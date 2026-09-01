/**
 * One question, on Today.
 *
 * This is the input side of the whole measurement architecture. Without it
 * the goal composer drafts check-in specs nobody is ever asked, the metrics
 * stream stays empty for anything the phone cannot measure, milestones with
 * measurable conditions never tick, and every projection reads "not enough
 * data" regardless of how well the person is doing.
 *
 * It shows one question and offers "not now" as a real answer. A daily form
 * is how a life-tracking app dies, and three fields in a row is a form.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { inputHintFor, nextCheckin, whyAsking } from '@/features/checkins/due';
import { useAppStore } from '@/state/store';

export function CheckinCard() {
  const goals = useAppStore((s) => s.goals);
  const metrics = useAppStore((s) => s.metrics);
  const dismissedCheckins = useAppStore((s) => s.dismissedCheckins);
  const answerCheckin = useAppStore((s) => s.answerCheckin);
  const dismissCheckin = useAppStore((s) => s.dismissCheckin);

  const [value, setValue] = useState('');
  const due = nextCheckin(goals, metrics, dismissedCheckins);

  if (!due) return null;

  const { unit } = inputHintFor(due.spec);

  const submit = () => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    answerCheckin(due.spec.id, due.spec.metricKey, n);
    setValue('');
  };

  return (
    <Card>
      <AppText variant="caption" color="textTertiary">
        {due.goal.title}
      </AppText>
      <AppText variant="heading" style={styles.question}>
        {due.question}
      </AppText>
      <AppText variant="caption" color="textTertiary">
        {whyAsking(due)}
      </AppText>
      <View style={styles.row}>
        <Field
          label={`${due.question}${unit ? ` in ${unit}` : ''}`}
          showLabel={false}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder={due.lastValue !== null ? String(due.lastValue) : unit || '0'}
          returnKeyType="done"
          onSubmitEditing={submit}
          width={110}
        />
        {unit ? (
          <AppText variant="caption" color="textTertiary">
            {unit}
          </AppText>
        ) : null}
        <Chip label="Save" selected onPress={submit} />
        <Chip label="Not now" onPress={() => dismissCheckin(due.spec.id)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  question: { marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
});
