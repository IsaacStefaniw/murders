import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { PANEL_ENTRIES } from '@/features/health/bodyEntries';
import {
  BP_FRESH_DAYS,
  PANEL_FRESH_DAYS,
  freshness,
  nonHdlMmol,
} from '@/features/health/bloodwork';
import { latest } from '@/features/model/metrics';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The three components a phone cannot see, and somewhere to put them.
 *
 * Blood pressure, lipids and glucose are three of Life's Essential 8, and
 * the markers screen reported all three as "needs a blood test" for as
 * long as there was nowhere to type the answer. Somebody with a pathology
 * report on the kitchen bench could read the app telling them it could not
 * see what was in their hand.
 *
 * They matter more than the four the app can already see. Activity, sleep,
 * nicotine and BMI all at 100 with a blood pressure of 165/100 is not
 * excellent cardiovascular health, and "4 of 8 observed · High" said to
 * that person is the worst sentence in the product.
 *
 * The three flags are here rather than in setup because the published
 * table branches on them and gets the score wrong without them — see
 * features/health/bloodwork.ts. Nothing else in the app reads them.
 */
export function BloodPanel() {
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const today = todayKey();

  const obs = (key: string) => latest(metrics, key);
  const known = (key: string) => obs(key)?.value ?? null;

  const sys = obs('body.bpSystolic');
  const dia = obs('body.bpDiastolic');
  const total = obs('blood.totalCholesterol');
  const hdl = obs('blood.hdl');
  const hba1c = obs('blood.hba1c');
  const fasting = obs('blood.fastingGlucose');

  const bpAge = sys && dia ? freshness(sys.at, today, BP_FRESH_DAYS) : null;
  const panelAge = total && hdl ? freshness(total.at, today, PANEL_FRESH_DAYS) : null;
  const nonHdl = total && hdl ? nonHdlMmol(total.value, hdl.value) : null;

  const save = () => {
    for (const entry of PANEL_ENTRIES) {
      const raw = drafts[entry.key];
      if (raw == null || raw.trim() === '') continue;
      const value = Number(raw);
      // A range check is the only judgement made here, and nothing is
      // corrected — a typed cholesterol of 55 is a typo, not a body.
      if (!Number.isFinite(value) || value < entry.min || value > entry.max) continue;
      addMetric(entry.key, Math.round(value * 10) / 10, 'entered by hand');
    }
    setDrafts({});
    setOpen(false);
  };

  const flag = (key: 'bpMedication' | 'lipidMedication' | 'diabetes', label: string) => (
    <Chip
      label={label}
      selected={Boolean(profile?.[key])}
      onPress={() => updateProfile({ [key]: !profile?.[key] })}
    />
  );

  const anything = sys || total || hba1c || fasting;

  return (
    <View>
      <SectionHeader title="Blood pressure and bloods" />

      {anything ? (
        <Card>
          <View style={styles.ratios}>
            {sys && dia ? (
              <View style={styles.ratio}>
                <AppText variant="label" color="textSecondary">
                  Blood pressure
                </AppText>
                <AppText variant="title">
                  {Math.round(sys.value)}/{Math.round(dia.value)}
                </AppText>
              </View>
            ) : null}
            {nonHdl != null ? (
              <View style={styles.ratio}>
                <AppText variant="label" color="textSecondary">
                  Non-HDL
                </AppText>
                <AppText variant="title">{nonHdl.toFixed(1)}</AppText>
              </View>
            ) : null}
            {hba1c ? (
              <View style={styles.ratio}>
                <AppText variant="label" color="textSecondary">
                  HbA1c
                </AppText>
                <AppText variant="title">{hba1c.value.toFixed(1)}%</AppText>
              </View>
            ) : null}
          </View>

          {/* A reading past its shelf life is still shown, because it is
              still their number — it simply stops counting. */}
          {bpAge && !bpAge.fresh ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              Blood pressure: {bpAge.line}
            </AppText>
          ) : null}
          {panelAge && !panelAge.fresh ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              Bloods: {panelAge.line}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {open ? (
        <Card style={styles.gap}>
          <View style={styles.fields}>
            {PANEL_ENTRIES.map((entry) => (
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

          <AppText variant="label" color="textTertiary" style={styles.gap}>
            Anything that applies
          </AppText>
          {/* Not a judgement and not advice. The published table scores
              somebody on treatment differently, and without these the
              score is simply wrong. */}
          <AppText variant="caption" color="textTertiary">
            The scoring tables treat a reading on treatment differently. Nothing here changes what
            the app asks of you, and none of it is medical advice.
          </AppText>
          <View style={styles.flags}>
            {flag('bpMedication', 'On blood pressure medication')}
            {flag('lipidMedication', 'On cholesterol medication')}
            {flag('diabetes', 'Diagnosed with diabetes')}
          </View>

          <View style={styles.actions}>
            <Button title="Save" onPress={save} hint="Adds these readings to your numbers." />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setDrafts({});
                setOpen(false);
              }}
            />
          </View>
        </Card>
      ) : (
        <Card style={styles.gap}>
          <AppText variant="secondary">
            {anything
              ? 'Kept until you replace it. A blood pressure counts for six months and a panel for two years, then it is shown as history.'
              : 'Three of the eight markers need a cuff or a pathology report. Type them in and they score like everything else.'}
          </AppText>
          <Button
            title={anything ? 'Update these' : 'Enter a reading'}
            variant="secondary"
            style={styles.gap}
            hint="Blood pressure, cholesterol, and HbA1c or fasting glucose."
            onPress={() => setOpen(true)}
          />
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.md },
  ratios: { flexDirection: 'row', gap: Spacing.xl, flexWrap: 'wrap' },
  ratio: { gap: 2 },
  fields: { gap: Spacing.lg },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  actions: { marginTop: Spacing.lg, gap: Spacing.sm },
});
