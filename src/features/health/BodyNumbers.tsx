import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { BMI_CONTEXT, VO2MAX_CONTEXT, conditioningFrom } from '@/features/health/conditioning';
import { readinessCoverage } from '@/features/health/readiness';
import { bmiFrom, waistToHeight } from '@/features/health/summarise';
import { BODY_ENTRIES } from '@/features/health/bodyEntries';
import { latest } from '@/features/model/metrics';
import { useAppStore } from '@/state/store';

/**
 * The numbers a training plan can actually use, and a way to enter them by
 * hand.
 *
 * Apple Health supplies most of these on an iPhone with a watch. Everyone
 * else — an old phone, an Android, a watch left in a drawer, permission
 * declined — had no way to give the engine a single one of them, which
 * meant the whole conditioning and recovery layer was invisible to them.
 * Every field here writes to exactly the same metric key the sync writes
 * to, so a hand-entered VO₂max drives the plan identically to a synced one.
 *
 * What is deliberately absent: any classification of the person. No
 * "below average", no coloured band. The published reference tables are
 * split by sex, we do not ask for sex, and guessing would be a confident
 * invisible error in half of all cases.
 */

export function BodyNumbers() {
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);

  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const known = (key: string) => latest(metrics, key)?.value ?? null;
  const height = known('body.height');
  const weight = known('body.weight');
  const waist = known('body.waist');

  const bmi = bmiFrom(weight, height);
  const wth = waistToHeight(waist, height);
  const conditioning = useMemo(() => conditioningFrom(metrics), [metrics]);
  // Said only when a signal is not coming at all, so a blank row is not
  // read as one more day of waiting for it.
  const coverage = useMemo(() => readinessCoverage(metrics), [metrics]);

  const save = () => {
    for (const entry of BODY_ENTRIES) {
      const raw = drafts[entry.key];
      if (raw == null || raw.trim() === '') continue;
      const value = Number(raw);
      // Silently dropping a typo would be worse than rejecting it, but a
      // range check is the only judgement made here — nothing is corrected.
      if (!Number.isFinite(value) || value < entry.min || value > entry.max) continue;
      addMetric(entry.key, Math.round(value * 10) / 10, 'entered by hand');
    }
    setDrafts({});
    setOpen(false);
  };

  return (
    <View>
      <SectionHeader title="Your body" />

      {bmi != null || wth != null ? (
        <Card>
          <View style={styles.ratios}>
            {wth != null ? (
              <View style={styles.ratio}>
                <AppText variant="label" color="textSecondary">
                  Waist ÷ height
                </AppText>
                <AppText variant="title">{wth.toFixed(2)}</AppText>
              </View>
            ) : null}
            {bmi != null ? (
              <View style={styles.ratio}>
                <AppText variant="label" color="textSecondary">
                  BMI
                </AppText>
                <AppText variant="title">{bmi}</AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.gap}>
            {BMI_CONTEXT}
          </AppText>
        </Card>
      ) : null}

      {conditioning ? (
        <Card style={styles.gap}>
          <AppText variant="heading">{conditioning.reading}</AppText>
          <AppText variant="secondary" style={styles.gap}>
            {conditioning.prescription}
          </AppText>
          <AppText variant="caption" color="textTertiary" style={styles.gap}>
            {conditioning.why}
          </AppText>
          <AppText variant="caption" color="textTertiary" style={styles.gap}>
            {VO2MAX_CONTEXT}
          </AppText>
        </Card>
      ) : null}

      {open ? (
        <Card style={styles.gap}>
          <View style={styles.fields}>
            {BODY_ENTRIES.map((entry) => (
              <Field
                key={entry.key}
                label={entry.label}
                hint={entry.hint}
                unit={entry.unit}
                keyboardType="numeric"
                placeholder={known(entry.key) != null ? String(known(entry.key)) : entry.unit}
                value={drafts[entry.key] ?? ''}
                onChangeText={(text) => setDrafts((d) => ({ ...d, [entry.key]: text }))}
              />
            ))}
          </View>
          <View style={styles.actions}>
            <Button title="Save" onPress={save} hint="Adds these readings to your numbers." />
            <Button title="Cancel" variant="ghost" onPress={() => { setDrafts({}); setOpen(false); }} />
          </View>
        </Card>
      ) : (
        <Card style={styles.gap}>
          <AppText variant="secondary">
            {BODY_ENTRIES.filter((e) => known(e.key) != null).length === 0
              ? 'Nothing here yet. Apple Health fills these in automatically — or enter them yourself, which works exactly the same way.'
              : 'Kept current by Apple Health where it can be. Anything it does not have, you can enter.'}
          </AppText>
          {coverage.note ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {coverage.note}
            </AppText>
          ) : null}
          <Button
            title="Enter my numbers"
            variant="secondary"
            style={styles.gap}
            hint="Height, weight, waist, resting heart rate, heart-rate variability and cardio fitness."
            onPress={() => setOpen(true)}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.md },
  ratios: { flexDirection: 'row', gap: Spacing.xl },
  ratio: { gap: 2 },
  fields: { gap: Spacing.lg },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
});
