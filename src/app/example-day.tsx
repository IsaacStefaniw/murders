import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { suggestWeek } from '@/features/modalities/meals/rotation';
import { buildLifeOperatingPlan } from '@/features/onboarding/buildPlan';
import type { InterviewAnswers } from '@/features/onboarding/script';
import { PATHS, type PathId } from '@/features/paths/definitions';
import { generateDailyPlan } from '@/features/planner/generate';
import { mergeRoutines } from '@/features/planner/mergeRoutines';
import { lengthLabel } from '@/features/today/plan-item-row';
import { addDays, formatTime, todayKey, weekStartOf, weekdayOf } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import type { PlanItem } from '@/types/domain';

/**
 * One real Monday, before a single question is asked.
 *
 * A tenth of a thousand reviewers wanted to see the app work before
 * committing to the interview. This is the honest version of that: the
 * same builder, the same pathways and the same scheduler a real profile
 * feeds, run on a made-up person with every coach started, shown as the
 * day they produce. Nothing is drawn for the camera; change the answers
 * below and the day changes with them.
 *
 * The first cut ran only the interview's own routines, and the day it
 * showed ended at lunch with two bare blocks titled "Work". That was the
 * plan a free account gets on day one, and it made the whole thing look
 * thin. This is the plan with the coaches running, which is what the
 * interview is for.
 */
const SAMPLE: InterviewAnswers = {
  name: 'Sam',
  weekShape: 'employed',
  priorities: ['health', 'family', 'work'],
  capacity: 'steady',
  workDays: ['1', '2', '3', '4', '5'],
  workHours: '09:00-17:30',
  sleep: '06:30-22:30',
  sleepQuality: 'broken',
  pressure: 'full',
  energy: 'morning',
  trainingDays: '3',
  trainingSetup: 'gym',
  trainingExperience: 'returning',
  household: ['partner', 'kids'],
  kidsCount: '2',
  workStyle: 'maker',
  mind: ['breathing'],
  foodAim: 'energy',
  foodTrouble: 'evenings',
  money: 'partial',
  lessOf: ['doomscrolling'],
  moreOf: ['Deep work', 'Cooking real food'],
  existingHabits: ['walking'],
  ambition: 'Get strong again without losing the evenings',
};

/** The coaches the interview does not start on its own, with the answers their intake would take. */
const ALSO_STARTED: { id: PathId; answers: Record<string, string> }[] = [
  { id: 'training', answers: { experience: 'returning', level: 'foundation', limiter: 'time' } },
  { id: 'work', answers: { style: 'maker' } },
  { id: 'family', answers: {} },
  { id: 'relationship', answers: {} },
];

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

/** The next Monday from today, so the day shown is always a working one. */
function nextMonday(from: string): string {
  const ahead = (8 - weekdayOf(from)) % 7 || 7;
  return addDays(from, ahead);
}

interface Row {
  key: string;
  start: string;
  end?: string;
  title: string;
  meta: string;
  note?: string;
  quiet?: boolean;
}

function metaFor(item: PlanItem): string {
  if (item.fixed && item.title === 'Work') return 'Your hours · fixed';
  if (item.fixed) return 'Carved out of your hours · fixed';
  return AREA_WORD[item.area] ?? item.area;
}

export default function ExampleDay() {
  const router = useRouter();
  const theme = useTheme();
  const day = useMemo(() => {
    const date = nextMonday(todayKey());
    const plan = buildLifeOperatingPlan(SAMPLE);
    let routines = plan.routines;
    for (const start of [...plan.pathStarts, ...ALSO_STARTED]) {
      routines = mergeRoutines(routines, PATHS[start.id].build(start.answers, plan.profile).routines);
    }
    const daily = generateDailyPlan(plan.profile, routines, date);
    const dinner = suggestWeek(weekStartOf(date), 'enjoy')[weekdayOf(date)];

    const rows: Row[] = daily.items.map((item) => ({
      key: item.id,
      start: item.start,
      end: item.end,
      title: item.title,
      meta: metaFor(item),
      note: /dinner/i.test(item.title) && dinner ? `Dinner is decided: ${dinner}` : undefined,
    }));
    // The work day is split around a free lunch window. Today does not list
    // it, because there is nothing to do; here it is worth seeing that the
    // gap is on purpose and the session sits inside it.
    const work = daily.items.filter((i) => i.fixed && i.title === 'Work');
    const beforeLunch = work.find((i) => i.end <= '12:00');
    const afterLunch = work.find((i) => i.start >= '13:00');
    if (beforeLunch && afterLunch) {
      rows.push({
        key: 'lunch',
        start: beforeLunch.end,
        end: afterLunch.start,
        title: 'Lunch — kept free',
        meta: 'Work never runs over it · the session fits inside',
        quiet: true,
      });
    }
    rows.sort((a, b) => a.start.localeCompare(b.start) || (a.quiet ? -1 : 1));
    return { rows, name: plan.profile.firstName };
  }, []);

  return (
    <Screen>
      <AppText variant="label" color="accent">
        An example day
      </AppText>
      <AppText variant="title">Sam’s Monday, already decided.</AppText>
      <AppText variant="secondary">
        Built for a made-up person — set hours, three training days, a partner and two kids — by
        the same planner your answers feed, with every coach running. Yours will look different,
        and every line will say why.
      </AppText>

      <SectionHeader title={`${day.name}’s Monday`} />
      <View style={styles.stack}>
        {day.rows.map((row) => {
          const length = row.end ? lengthLabel({ start: row.start, end: row.end }) : null;
          return (
            <Card key={row.key} style={[styles.row, row.quiet ? { borderStyle: 'dashed' } : null]}>
              <View style={styles.time}>
                <AppText variant="caption" color="textTertiary">
                  {formatTime(row.start)}
                </AppText>
                {length ? (
                  <AppText variant="caption" color="textTertiary">
                    {length}
                  </AppText>
                ) : null}
              </View>
              <View style={styles.grow}>
                <AppText variant="body" style={row.quiet ? { color: theme.textSecondary } : null}>
                  {row.title}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {row.meta}
                </AppText>
                {row.note ? (
                  <AppText variant="caption" color="accent">
                    {row.note}
                  </AppText>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Twelve quick questions build yours. The day above changes when a night is short, a meeting
        lands on the walk, or you move something — and it says why each time. The coaches that
        place the sessions run with Plus; the day’s shape is free.
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
  time: { minWidth: 64, paddingTop: 2, gap: 2 },
  grow: { flex: 1, gap: 2 },
  note: { marginTop: Spacing.md },
  footer: { marginTop: Spacing.lg, gap: Spacing.sm },
});
