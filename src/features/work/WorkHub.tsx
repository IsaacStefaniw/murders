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
import { assessWork, weekOfBlock } from '@/features/work/programme';
import { useTheme } from '@/hooks/use-theme';
import { deriveWorkInputs, useAppStore } from '@/state/store';

/**
 * Work & Leadership v2 hub — the executive block. One theme, one
 * leadership practice, one honest deep-hours target per week; the weekly
 * deep-hours log is the number the block is judged by.
 */
export function WorkHub() {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const paths = useAppStore((s) => s.paths);
  const metrics = useAppStore((s) => s.metrics);
  const block = useAppStore((s) => s.workBlock);
  const addMetric = useAppStore((s) => s.addMetric);
  const buildWorkBlock = useAppStore((s) => s.buildWorkBlock);

  const [hoursLog, setHoursLog] = useState('');

  const inputs = useMemo(
    () => (profile ? deriveWorkInputs(profile, paths.work?.answers) : null),
    [profile, paths.work?.answers],
  );
  const assessment = useMemo(
    () => (inputs ? assessWork(inputs, metrics) : null),
    [inputs, metrics],
  );
  const week = block ? weekOfBlock(block) : null;
  const wk = block && week ? block.weeks[week - 1] : null;
  const deepTrend = trend(metrics, 'work.deepHours', 28);
  const lastHours = latest(metrics, 'work.deepHours');


  return (
    <View>
      <SectionHeader title="Your numbers" />
      <Card style={styles.row}>
        <AppText variant="body" style={styles.grow}>
          Deep work (last logged week)
        </AppText>
        <AppText variant="heading">
          {deepTrend ? `${deepTrend.from} → ${deepTrend.to} h` : lastHours ? `${lastHours.value} h` : '—'}
        </AppText>
      </Card>
      <View style={styles.inputRow}>
        <Field
          label="This week's deep-work hours"
          showLabel={false}
          value={hoursLog}
          onChangeText={setHoursLog}
          keyboardType="numeric"
          placeholder="h"
          width={84}
        />
        <Button
          title="Log this week's deep hours"
          variant="secondary"
          disabled={!Number(hoursLog)}
          onPress={() => {
            addMetric('work.deepHours', Number(hoursLog));
            setHoursLog('');
          }}
        />
      </View>

      {assessment ? (
        <Card
          style={{
            marginTop: Spacing.lg,
            borderColor: assessment.verdict === 'on-track' ? theme.accent : theme.border,
          }}
        >
          <AppText variant="body">{assessment.message}</AppText>
        </Card>
      ) : null}

      <QuestionCard domain="work" />

      <SectionHeader
        title={wk && week ? `Executive block · Week ${week} — ${wk.theme}` : 'Your executive block'}
      />
      {wk ? (
        <View style={styles.stack}>
          <Card>
            <AppText variant="body">{wk.focus}</AppText>
            <AppText variant="caption" color="textTertiary" style={styles.line}>
              Deep-work target: ~{wk.deepHoursTarget} h this week.
            </AppText>
          </Card>
          <Card style={{ borderColor: theme.accent }}>
            <AppText variant="heading">This week&apos;s practice: {wk.practice.title}</AppText>
            <AppText variant="caption" color="textTertiary" style={styles.line}>
              {wk.practice.detail}
            </AppText>
          </Card>
        </View>
      ) : (
        <View style={styles.stack}>
          {block ? (
            <AppText variant="secondary">
              Block complete — the Friday memo closes it. Rebuild and the next four weeks start
              from what the numbers said.
            </AppText>
          ) : (
            <AppText variant="secondary">
              Four weeks, one theme each: audit &amp; protect → the one lever → subtract → review.
              One leadership practice a week and a deep-hours target your real calendar can honour.
            </AppText>
          )}
          <Button
            title={block ? 'Start the next block' : 'Start my executive block'}
            onPress={buildWorkBlock}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  line: { marginTop: Spacing.xs },
});
