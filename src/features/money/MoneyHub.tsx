import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { QuestionCard } from '@/features/model/QuestionCard';
import { assessMoney, buildMoneyLadder } from '@/features/money/plan';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Money v2 hub — the ordered ladder with one step under the spotlight,
 * and the one number that matters: the savings rate, judged by trend.
 * Education, never financial advice.
 */
export function MoneyHub() {
  const theme = useTheme();
  const paths = useAppStore((s) => s.paths);
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);

  const [rateLog, setRateLog] = useState('');

  const answers = paths.money?.answers ?? {};
  const ladder = useMemo(
    () =>
      buildMoneyLadder({
        mode: answers.mode,
        automation: answers.automation as 'yes' | 'partial' | 'no' | undefined,
        buffer: answers.buffer as 'none' | 'some' | 'solid' | undefined,
      }),
    [answers.mode, answers.automation, answers.buffer],
  );
  const assessment = useMemo(() => assessMoney(metrics), [metrics]);


  return (
    <View>
      <SectionHeader title="Your number" />
      <Card style={styles.row}>
        <AppText variant="body" style={styles.grow}>
          Savings rate (last month)
        </AppText>
        <AppText variant="heading">
          {assessment.trend
            ? `${assessment.trend.from}% → ${assessment.trend.to}%`
            : assessment.rate != null
              ? `${assessment.rate}%`
              : '—'}
        </AppText>
      </Card>
      <View style={styles.inputRow}>
        <Field
          label="Last month's savings rate, as a percentage"
          showLabel={false}
          value={rateLog}
          onChangeText={setRateLog}
          keyboardType="numeric"
          placeholder="%"
          width={84}
        />
        <Button
          title="Log last month's rate"
          variant="secondary"
          disabled={!Number(rateLog)}
          onPress={() => {
            addMetric('finance.savingsRate', Number(rateLog));
            setRateLog('');
          }}
        />
      </View>

      <Card
        style={{
          marginTop: Spacing.lg,
          borderColor: assessment.verdict === 'on-track' ? theme.accent : theme.border,
        }}
      >
        <AppText variant="body">{assessment.message}</AppText>
      </Card>

      <QuestionCard domain="finance" />

      <SectionHeader title="Your steps, in order" />
      <View style={styles.stack}>
        {ladder.map((s) => (
          <Card
            key={s.id}
            style={[
              s.state === 'later' ? styles.dimmed : null,
              s.state === 'now' ? { borderColor: theme.accent } : null,
            ]}
          >
            <AppText variant="heading">
              {s.state === 'done' ? '✓ ' : s.state === 'now' ? '→ ' : ''}
              {s.title}
            </AppText>
            <AppText variant="caption" color="textTertiary">
              {s.state === 'now' ? 'This is the step · ' : ''}
              {s.detail}
            </AppText>
          </Card>
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        One step at a time, in the order the maths supports. Educational structure, never
        financial advice.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  dimmed: { opacity: 0.55 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  hint: { marginTop: Spacing.sm },
});
