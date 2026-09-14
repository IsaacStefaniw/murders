import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  FUNCTION_MARKERS,
  FUNCTION_TESTS,
  functionMetricKey,
  type FunctionTest,
} from '@/features/health/functionTests';
import { useAppStore } from '@/state/store';

/**
 * Running the four tests, and recording what came out.
 *
 * The instructions are the feature. Every one of these is a test a
 * researcher runs in a clinic with a protocol sheet, and the difference
 * between a useful reading and a meaningless one is entirely in whether
 * the person did it the same way twice — arms folded, usual pace not best
 * pace, the same shoes. So the steps are numbered, complete, and written
 * for somebody who has never seen the test before.
 *
 * The safety line is above the steps rather than below them, because two
 * of these ask an older or unsteady person to challenge their own balance,
 * which is exactly the circumstance in which people fall.
 */

function TestRunner({ test }: { test: FunctionTest }) {
  const addMetric = useAppStore((s) => s.addMetric);
  const snapshotPace = useAppStore((s) => s.snapshotPace);
  const metrics = useAppStore((s) => s.metrics);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const key = functionMetricKey(test.id);
  const last = metrics.filter((m) => m.key === key).sort((a, b) => b.at.localeCompare(a.at))[0];
  const parsed = Number.parseFloat(value);
  const valid = Number.isFinite(parsed) && parsed >= 0;

  return (
    <Card>
      <AppText variant="heading">{test.name}</AppText>
      <AppText variant="caption" color="textSecondary" style={styles.gap}>
        {test.measures}
      </AppText>
      {last ? (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Last time: {last.value} {test.unit}, on {last.at.slice(0, 10)}.
        </AppText>
      ) : (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Needs: {test.needs}
        </AppText>
      )}

      {!open ? (
        <View style={styles.actions}>
          <Button
            title={last ? 'Do it again' : 'How to do it'}
            variant="secondary"
            onPress={() => setOpen(true)}
          />
        </View>
      ) : (
        <>
          {/* Above the steps, not below them. */}
          <View style={styles.safety}>
            <AppText variant="caption" color="accent">
              Before you start: {test.safety}
            </AppText>
          </View>

          <View style={styles.steps}>
            {test.steps.map((step, i) => (
              <AppText key={step} variant="body" style={styles.step}>
                {i + 1}. {step}
              </AppText>
            ))}
          </View>

          <View style={styles.section}>
            <Field
              label={`Result, in ${test.unit}`}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              unit={test.unit}
              width={100}
            />
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {FUNCTION_MARKERS[test.id].means}
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="caption" color="textTertiary">
              {test.evidence}
            </AppText>
          </View>

          <View style={styles.actions}>
            <Button
              title="Record it"
              disabled={!valid}
              onPress={() => {
                addMetric(key, parsed, test.name);
                // File a reading straight after, so the movement this test
                // causes is attributable later — and attributed to better
                // measurement rather than to the person having changed.
                snapshotPace();
                setValue('');
                setOpen(false);
              }}
            />
            <Button title="Not now" variant="ghost" onPress={() => setOpen(false)} />
          </View>
        </>
      )}
    </Card>
  );
}

export function FunctionTestList() {
  return (
    <View style={styles.list}>
      <AppText variant="caption" color="textSecondary">
        Four tests, about ten minutes between them, and three of the four need nothing you do not
        already own. Every one is a measurement from a large study rather than something we made up
        — and every one is a reading that says look here, never a verdict.
      </AppText>
      {FUNCTION_TESTS.map((t) => (
        <TestRunner key={t.id} test={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
  gap: { marginTop: Spacing.xs },
  safety: { marginTop: Spacing.md },
  steps: { marginTop: Spacing.md, gap: Spacing.xs },
  step: {},
  section: { marginTop: Spacing.md },
  actions: { marginTop: Spacing.md, gap: Spacing.xs },
});
