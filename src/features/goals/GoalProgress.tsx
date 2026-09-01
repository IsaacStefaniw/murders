import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/store';
import type { Goal } from '@/types/domain';

import { assessGoal, dueCheckin } from './composer';

/**
 * The living face of a composed goal on its card: the assessment verdict
 * with its reason, and — when one is due — the goal's single check-in
 * question. An answer lands as a metric observation; the store's evidence
 * pass then checks off any rung the number satisfies, so the effect of
 * answering is visible immediately.
 */
export function GoalProgress({ goal }: { goal: Goal }) {
  const metrics = useAppStore((s) => s.metrics);
  const planEvents = useAppStore((s) => s.planEvents);
  const addMetric = useAppStore((s) => s.addMetric);
  const [answer, setAnswer] = useState('');

  if (!goal.milestones?.length) return null;

  const assessment = assessGoal(goal, { metrics, planEvents });
  const due = dueCheckin(goal, metrics);

  const stateLabel =
    assessment.state === 'done'
      ? 'Complete'
      : assessment.state === 'on-track'
        ? 'On track'
        : assessment.state === 'stalled'
          ? 'Quiet lately'
          : 'Needs a first reading';

  const save = () => {
    if (!due) return;
    addMetric(due.metricKey, Number(answer), goal.title);
    setAnswer('');
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color={assessment.state === 'stalled' ? 'accent' : 'textTertiary'}>
        {stateLabel} · {assessment.reason}
      </AppText>
      {due ? (
        <View style={styles.inputRow}>
          <AppText variant="body" style={styles.prompt}>
            {due.prompt ?? due.label}
          </AppText>
          <Field
            label={`${due.prompt ?? due.label}${due.unit ? ` in ${due.unit}` : ''}`}
            showLabel={false}
            value={answer}
            onChangeText={setAnswer}
            keyboardType="numeric"
            placeholder={due.unit ?? ''}
            width={96}
          />
          <Button title="Save" disabled={!Number(answer)} onPress={save} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.sm, gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  prompt: { flexShrink: 1, flexBasis: '100%' },
});
