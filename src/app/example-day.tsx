import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { generateDailyPlan } from '@/features/planner/generate';
import { formatTime, todayKey } from '@/lib/dates';

/**
 * One real day, before a single question is asked.
 *
 * A tenth of a thousand reviewers wanted to see the app work before
 * committing to the interview. This is the honest version of that: the
 * same builder and the same scheduler the interview feeds, run on a made-up
 * person, shown as the day it produces. Nothing is drawn for the camera;
 * change the answers below and the day changes with them.
 */
const SAMPLE: InterviewAnswers = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['health', 'family', 'work'],
  capacity: 'steady',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  energy: 'morning',
  trainingDays: '3',
  household: ['partner', 'kids'],
  ambition: 'Get strong again without losing the evenings',
};

const AREA_WORD: Record<string, string> = {
  health: 'Health',
  work: 'Work',
  family: 'Family',
  relationship: 'Relationship',
  money: 'Money',
  mind: 'Mind',
  recovery: 'Habits',
  growth: 'Growth',
};

export default function ExampleDay() {
  const router = useRouter();
  const day = useMemo(() => {
    const plan = buildLifeOperatingPlan(SAMPLE);
    const daily = generateDailyPlan(plan.profile, plan.routines, todayKey());
    return { profile: plan.profile, items: daily.items };
  }, []);

  return (
    <Screen>
      <AppText variant="label" color="accent">
        An example day
      </AppText>
      <AppText variant="title">This is what a day looks like.</AppText>
      <AppText variant="secondary">
        Built for a made-up person — Sam, set hours, trains three days, a partner and kids, health
        first — by the same planner your own answers will feed. Yours will look different, and
        every line on it will say why it is there.
      </AppText>

      <SectionHeader title="Sam's day" />
      <View style={styles.stack}>
        {day.items.map((item) => (
          <Card key={item.id} style={styles.row}>
            <AppText variant="caption" color="textTertiary" style={styles.time}>
              {formatTime(item.start)}
            </AppText>
            <View style={styles.grow}>
              <AppText variant="body">{item.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {AREA_WORD[item.area] ?? item.area}
                {item.fixed ? ' · fixed' : ''}
              </AppText>
            </View>
          </Card>
        ))}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Twelve quick questions build yours. The day above changes when a night is short, a meeting
        lands on the walk, or you move something — and it says why each time.
      </AppText>

      <View style={styles.footer}>
        <Button title="Build mine" onPress={() => router.replace('/interview' as never)} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  time: { minWidth: 64, paddingTop: 2 },
  grow: { flex: 1, gap: 2 },
  note: { marginTop: Spacing.md },
  footer: { marginTop: Spacing.lg, gap: Spacing.sm },
});
