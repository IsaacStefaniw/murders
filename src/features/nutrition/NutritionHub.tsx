import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { latest, trend } from '@/features/model/metrics';
import { QuestionCard } from '@/features/model/QuestionCard';
import {
  assessNutrition,
  buildNutritionPlan,
  type NutritionInputs,
} from '@/features/nutrition/plan';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Nutrition v2 hub — complexity behind the glass. The user sees their
 * protein anchor, their weight TREND (never one day), the one lever
 * that's live, and at most one question. The trend—not a good or bad
 * day—decides when the next lever switches on.
 */
export function NutritionHub() {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const paths = useAppStore((s) => s.paths);
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);

  const [weighIn, setWeighIn] = useState('');

  const answers = paths.nutrition?.answers ?? {};
  const inputs: NutritionInputs = useMemo(
    () => ({
      aim: (answers.aim as NutritionInputs['aim']) || 'energy',
      weightKg: profile?.weightKg ?? latest(metrics, 'body.weight')?.value,
      cooking: answers.cooking as NutritionInputs['cooking'],
      trouble: answers.trouble as NutritionInputs['trouble'],
      leverLevel: Number(answers.leverLevel) || 0,
    }),
    [answers.aim, answers.cooking, answers.trouble, answers.leverLevel, profile?.weightKg, metrics],
  );
  const plan = useMemo(() => buildNutritionPlan(inputs), [inputs]);
  const assessment = useMemo(() => assessNutrition(inputs, metrics), [inputs, metrics]);
  const weightTrend = trend(metrics, 'body.weight', 21);


  return (
    <View>
      <SectionHeader title="Your numbers" />
      <View style={styles.stack}>
        {plan.proteinTarget ? (
          <Card style={styles.row}>
            <AppText variant="body" style={styles.grow}>
              Protein anchor
            </AppText>
            <AppText variant="heading">
              {plan.proteinTarget.minG}–{plan.proteinTarget.maxG} g/day
            </AppText>
          </Card>
        ) : null}
        {plan.proteinTarget ? (
          <AppText variant="caption" color="textTertiary">
            ≈ {plan.proteinTarget.perMealG} g across {plan.proteinTarget.meals} meals. Hit that and
            most of nutrition takes care of itself.
          </AppText>
        ) : null}
        <Card style={styles.row}>
          <AppText variant="body" style={styles.grow}>
            Weight trend (3 wk)
          </AppText>
          <AppText variant="heading">
            {weightTrend
              ? `${weightTrend.from} → ${weightTrend.to} kg`
              : (latest(metrics, 'body.weight')?.value ?? profile?.weightKg ?? '—')}
          </AppText>
        </Card>
      </View>

      {/* Weigh-in — feeds the trend; the trend feeds everything. */}
      <View style={styles.inputRow}>
        <Field
          label="Weigh-in, in kilograms"
          showLabel={false}
          value={weighIn}
          onChangeText={setWeighIn}
          keyboardType="numeric"
          placeholder="kg"
          width={84}
        />
        <Button
          title="Log weigh-in"
          variant="secondary"
          disabled={!Number(weighIn)}
          onPress={() => {
            addMetric('body.weight', Number(weighIn));
            setWeighIn('');
          }}
        />
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        Two or three a week, same time of day. IntentNorth only ever reads the trend — a heavy day is
        water, not truth.
      </AppText>

      {/* The verdict — trend-based, legible, honest. */}
      <Card
        style={{
          marginTop: Spacing.lg,
          borderColor: assessment.verdict === 'on-track' ? theme.accent : theme.border,
        }}
      >
        <AppText variant="body">{assessment.message}</AppText>
        {assessment.advanceLever ? (
          <Button
            title={`Switch on: ${plan.levers.find((l) => l.state === 'next')?.title ?? 'next lever'}`}
            onPress={() =>
              updatePathAnswers('nutrition', { leverLevel: String(plan.leverLevel + 1) })
            }
            style={styles.advance}
          />
        ) : null}
      </Card>

      <QuestionCard domain="nutrition" />

      {/* The ladder — one lever at a time, in the order YOUR answers set. */}
      <SectionHeader title="The lever ladder" />
      <View style={styles.stack}>
        {plan.levers.map((l) => (
          <Card key={l.id} style={{ opacity: l.state === 'later' ? 0.55 : 1 }}>
            <AppText variant="heading">
              {l.state === 'live' ? '● ' : l.state === 'next' ? '○ ' : ''}
              {l.title}
            </AppText>
            <AppText variant="caption" color="textTertiary">
              {l.state === 'live' ? 'Live now · ' : l.state === 'next' ? 'Next up · ' : ''}
              {l.detail}
            </AppText>
          </Card>
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        {plan.plate} One lever at a time — the trend, not a hard week, decides when the next one
        switches on.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  hint: { marginTop: Spacing.sm },
  advance: { marginTop: Spacing.md },
});
