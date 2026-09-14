import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Disclosure } from '@/components/disclosure';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import {
  alcoholWeek,
  weekHealth,
  type Component,
  type NicotineStatus,
} from '@/features/health/essential8';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The week, against a published measure of cardiovascular health.
 *
 * Isaac asked for "a health wellbeing score based on items logged for the
 * week vs unhealthy habits". The easy build is a number of our own that
 * goes up when you train and down when you drink. This is not that, for a
 * reason worth stating: a made-up composite cannot tell anyone what moving
 * it buys, so it ends up being a number people chase instead of a number
 * that means something.
 *
 * Life's Essential 8 can. It is the American Heart Association's 2022
 * construct, and in prospective cohorts a higher score carries a linear
 * dose-response with all-cause and cardiovascular mortality. The card says
 * that out loud, because "this predicts something real" is the only
 * justification for showing anybody a score at all.
 *
 * What the card will not do:
 *  - Call itself a Life's Essential 8 score. It reads four of the eight,
 *    and the four it cannot read include the three blood measures where a
 *    great deal of the risk sits. Every headline says "of 8".
 *  - Subtract. Drinking does not pull points off training. Alcohol sits
 *    beside the score against its own Australian guideline, counted in
 *    occasions because that is what the app actually records.
 *  - Score a week it did not watch. An unmeasured week reads as unmeasured,
 *    never as a zero.
 *
 * The missing four are shown rather than hidden, each with the reason and
 * what would fill it in. A blood pressure cuff is free at a pharmacy and
 * blood pressure is the single largest contributor to cardiovascular risk
 * at population level — naming the gap is more use to somebody than
 * quietly averaging over it.
 */

const BAND_LABEL = {
  high: 'High',
  intermediate: 'Intermediate',
  low: 'Low',
} as const;

const NICOTINE_CHOICES: { value: NicotineStatus; label: string }[] = [
  { value: 'never', label: 'Never used' },
  { value: 'quit5y', label: 'Quit 5+ years ago' },
  { value: 'quit1to5y', label: 'Quit 1–5 years ago' },
  { value: 'inhaledNicotine', label: 'I vape' },
  { value: 'smokesNow', label: 'I smoke' },
];

/** The published 0–100, drawn. No colour coding: a bar, not a traffic light. */
function ScoreBar({ score }: { score: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { backgroundColor: theme.border }]}
    >
      <View style={[styles.fill, { width: `${score}%`, backgroundColor: theme.accent }]} />
    </View>
  );
}

function ComponentRow({ component }: { component: Component }) {
  const theme = useTheme();
  const scored = component.score !== null;
  return (
    <View style={[styles.row, { borderTopColor: theme.border }]}>
      <View style={styles.rowHead}>
        <AppText variant="body" style={styles.grow}>
          {component.label}
        </AppText>
        <AppText
          variant="body"
          color={scored && !component.misread ? 'text' : 'textTertiary'}
          accessibilityLabel={
            component.misread
              ? `${component.label}, not counted — this measure does not describe you`
              : scored
                ? `${component.label}, ${component.score} out of 100`
                : `${component.label}, not scored`
          }
        >
          {component.misread ? 'Not counted' : scored ? `${component.score}` : '—'}
        </AppText>
      </View>
      {scored && !component.misread ? <ScoreBar score={component.score!} /> : null}
      <AppText variant="caption" color="textSecondary" style={styles.detail}>
        {component.detail}
      </AppText>
      {component.misread ? (
        <AppText variant="caption" color="must" style={styles.detail}>
          {component.misread}
        </AppText>
      ) : null}
      {component.blocked ? (
        <AppText variant="caption" color="textTertiary" style={styles.detail}>
          {component.blocked}
        </AppText>
      ) : null}
      <Disclosure title={`Why ${component.label.toLowerCase()} is in this`}>
        <AppText variant="caption" color="textSecondary">
          {component.why}
        </AppText>
      </Disclosure>
    </View>
  );
}

export function WellbeingCard() {
  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const metrics = useAppStore((s) => s.metrics);
  const intentions = useAppStore((s) => s.behaviourIntentions);
  const events = useAppStore((s) => s.behaviourEvents);
  const cardioLogs = useAppStore((s) => s.cardioLogs);
  const stated = useAppStore((s) => s.nicotineStatus);
  const profile = useAppStore((s) => s.profile);
  const setNicotineStatus = useAppStore((s) => s.setNicotineStatus);
  const today = todayKey();

  const week = useMemo(
    () =>
      weekHealth({
        plans,
        routines,
        cardioLogs,
        metrics,
        intentions,
        events,
        today,
        nicotine: stated ?? undefined,
        sexAtBirth:
          profile?.sexAtBirth === 'male' || profile?.sexAtBirth === 'female'
            ? profile.sexAtBirth
            : null,
      }),
    [plans, routines, cardioLogs, metrics, intentions, events, today, stated, profile?.sexAtBirth],
  );
  const alcohol = useMemo(
    () => alcoholWeek(intentions, events, today),
    [intentions, events, today],
  );

  const observable = week.components.slice(0, 4);
  const needsMore = week.components.slice(4);
  const askNicotine = !stated && week.components[1].score === null;

  return (
    <Card>
      <AppText variant="label" color="textSecondary">
        This week
      </AppText>
      <AppText variant="heading" style={styles.gap}>
        {week.headline}
      </AppText>
      {week.band ? (
        <AppText variant="caption" color="textSecondary">
          {BAND_LABEL[week.band]} on the American Heart Association&apos;s scale, where 75 and above
          is high and under 50 is low.
        </AppText>
      ) : week.counted.length > 0 ? (
        /* Readable, but not enough of the construct to carry its categories.
           The band is published for the mean of eight; naming it off one or
           two would be the app inventing a verdict out of coverage. */
        <AppText variant="caption" color="textSecondary">
          Not enough of the eight yet to say where this sits overall — the Association&apos;s
          high/intermediate/low scale is defined across all eight, and naming it off{' '}
          {week.counted.length === 1 ? 'one' : week.counted.length} would be reading more than we
          measured. Each one below stands on its own published threshold.
        </AppText>
      ) : (
        <AppText variant="caption" color="textSecondary">
          Plan a session, log a night&apos;s sleep, or add your height and weight, and this starts
          reading.
        </AppText>
      )}

      <Disclosure title="Where this number comes from" hint="The evidence behind the score">
        <AppText variant="caption" color="textSecondary">
          Life&apos;s Essential 8 is the American Heart Association&apos;s 2022 measure of
          cardiovascular health: eight things, each scored 0–100 against published thresholds, with
          the score being their average. It is here rather than a measure of our own because it has
          been tested as a predictor — in large long-running studies, a higher score tracks a lower
          risk of dying, of any cause and of heart disease specifically, and does so steadily rather
          than only at the extremes. Moving it appears to move something real.
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          This app can read {week.counted.length} of the eight. Four need a blood test, a blood
          pressure cuff or a full diet questionnaire, and three of those four are where a large share
          of the risk actually sits — so this is not a Life&apos;s Essential 8 score and is never
          shown as one. It is the average of what is visible, labelled every time with how much of
          the picture that is.
        </AppText>
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          This is education, not medical advice, and it is not a diagnosis. If anything here worries
          you, a GP is the right next step.
        </AppText>
      </Disclosure>

      {week.biggestGap && week.counted.length > 1 ? (
        <View style={styles.gap}>
          <AppText variant="caption" color="textSecondary">
            The most room, in published points, is in {week.biggestGap.label.toLowerCase()}.
          </AppText>
        </View>
      ) : null}

      {observable.map((c) => (
        <ComponentRow key={c.key} component={c} />
      ))}

      {askNicotine ? (
        <View style={styles.ask}>
          <AppText variant="body">Which of these is true for you?</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.detail}>
            Nicotine is the largest single component, and never having used it and having quit last
            year sit a hundred points apart. The app can&apos;t tell those apart from what it logs,
            so it asks instead of guessing. Answer once.
          </AppText>
          <View style={styles.chips}>
            {NICOTINE_CHOICES.map((c) => (
              <Chip key={c.value} label={c.label} onPress={() => setNicotineStatus(c.value)} />
            ))}
          </View>
        </View>
      ) : null}

      {alcohol ? (
        <View style={styles.aside}>
          <AppText variant="label" color="textSecondary">
            Alcohol, beside the score
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.detail}>
            {alcohol.line}
          </AppText>
          <AppText variant="caption" color="textTertiary" style={styles.detail}>
            It is not one of the eight, so adding it in would make this our score wearing the
            Association&apos;s name. It sits here instead, against the Australian guideline, and it
            takes nothing off anything above.
          </AppText>
        </View>
      ) : null}

      <Disclosure title={`The ${needsMore.length} this app can’t see`}>
        {needsMore.map((c) => (
          <View key={c.key} style={styles.missing}>
            <AppText variant="body">{c.label}</AppText>
            <AppText variant="caption" color="textSecondary">
              {c.why}
            </AppText>
            <AppText variant="caption" color="textTertiary">
              {c.blocked}
            </AppText>
          </View>
        ))}
      </Disclosure>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.xs },
  detail: { marginTop: Spacing.xs },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.sm, marginTop: Spacing.sm, gap: Spacing.xs },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  grow: { flex: 1 },
  track: { height: 6, borderRadius: Radius.sm, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.sm },
  ask: { marginTop: Spacing.md, gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  aside: { marginTop: Spacing.md },
  missing: { marginTop: Spacing.sm, gap: 2 },
});
