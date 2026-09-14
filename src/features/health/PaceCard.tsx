import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Disclosure } from '@/components/disclosure';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { FUNCTION_TESTS } from '@/features/health/functionTests';
import { paceHeadline, paceShareText, readPace } from '@/features/health/pace';
import { paceInputsFrom } from '@/features/health/paceInputs';
import { paceProgress } from '@/features/health/progress';
import { readingFromSnapshot } from '@/features/health/snapshot';
import { useTheme } from '@/hooks/use-theme';
import { shareText } from '@/lib/share';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The headline figure, with the width of its error bars beside it.
 *
 * Isaac chose a headline number over showing the components alone, and
 * this is that — a single figure, large, shareable. The thing it does
 * differently from the rest of the category is that the interval is part
 * of the headline rather than a footnote, because `PaceHeadline` makes the
 * interval and the coverage non-optional fields and there is no way to
 * render the number without them.
 *
 * That turns out to be the better mechanic rather than a compromise. The
 * interval narrows as somebody measures more, so the honest thing and the
 * engaging thing are the same thing: "±8, or ±5 if you do the other two
 * tests" is a better call to action than any number alone.
 *
 * The share text carries the interval, the coverage and the caveat in the
 * body. A number that leaves the app loses its screen, and with it every
 * qualification sitting underneath — so the qualification travels with it
 * or there was no point putting it on screen.
 */

export function PaceCard() {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const cardioLogs = useAppStore((s) => s.cardioLogs);
  const metrics = useAppStore((s) => s.metrics);
  const intentions = useAppStore((s) => s.behaviourIntentions);
  const events = useAppStore((s) => s.behaviourEvents);
  const stated = useAppStore((s) => s.nicotineStatus);
  const answers = useAppStore((s) => s.interviewAnswers);
  const snapshots = useAppStore((s) => s.paceSnapshots);
  const sleepNights = useAppStore((s) => s.sleepNights);
  const weeklyCounts = useAppStore((s) => s.weeklyCounts);
  const [shared, setShared] = useState(false);
  const today = todayKey();

  const inputs = useMemo(
    () =>
      paceInputsFrom({
        profile: profile ?? null,
        metrics,
        plans,
        routines,
        cardioLogs,
        behaviourIntentions: intentions,
        behaviourEvents: events,
        nicotineStatus: stated,
        interviewAnswers: answers,
        weeklyCounts,
        sleepNights,
        today,
      }),
    [profile, metrics, plans, routines, cardioLogs, intentions, events, stated, answers, weeklyCounts, sleepNights, today],
  );

  const reading = useMemo(() => readPace(inputs), [inputs]);

  const headline = useMemo(
    () => paceHeadline(reading, profile?.age),
    [reading, profile?.age],
  );

  /**
   * Movement since the earliest snapshot, split into what actually changed
   * and what is only us knowing more.
   *
   * The split is the point. A person who answers two questions at signup
   * and then does the four tests a fortnight later will see the figure
   * move several years, and none of that is them getting healthier.
   */
  const progress = useMemo(() => {
    if (snapshots.length < 2) return null;
    const first = readingFromSnapshot(snapshots[0], reading);
    return paceProgress(first, reading);
  }, [snapshots, reading]);

  const MEASURED: Record<string, number | null | undefined> = {
    gripStrength: inputs.gripKg,
    oneLegStand: inputs.balanceSeconds,
    gaitSpeed: inputs.gaitMs,
  };
  const untested = FUNCTION_TESTS.filter((t) => t.id in MEASURED && MEASURED[t.id] == null);

  /** Components where the evidence supports a number for CHANGING. */
  const opportunities = reading.components.filter((c) => c.opportunity);

  if (!headline) {
    return (
      <Card>
        <AppText variant="heading">Your markers</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          {profile?.age == null
            ? 'Add your age in your profile and this starts reading.'
            : 'Two questions would start this off — how your health feels to you, and your usual walking pace. Both are in your recovery answers, both take a second, and between them they carry more evidence than most of what a longevity panel measures.'}
        </AppText>
      </Card>
    );
  }

  const delta = headline.chronological - headline.years;

  return (
    <Card>
      <View style={styles.head}>
        <AppText variant="label" color="textSecondary">
          Your markers
        </AppText>
        <AppText variant="caption" color="textTertiary">
          provisional
        </AppText>
      </View>

      <View style={styles.hero}>
        <AppText
          variant="title"
          style={styles.number}
          accessibilityLabel={`${headline.years}, give or take ${headline.plusMinus} years, from ${headline.coverage.observed} of ${headline.coverage.total} markers. You are ${headline.chronological}.`}
        >
          {headline.years}
        </AppText>
        {/* The interval is the same size as the caption under it, not
            smaller, and it is never behind a tap. A figure this uncertain
            shown alone would be the thing the whole module exists to
            avoid. */}
        <AppText variant="body" color="textSecondary">
          give or take {headline.plusMinus}
        </AppText>
      </View>

      <AppText variant="body" style={styles.gap}>
        {delta === 0
          ? `You are ${headline.chronological}, and your markers sit about where they usually do at that age.`
          : `You are ${headline.chronological}. Your markers sit where a ${headline.years}-year-old's usually do — ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'year' : 'years'} ${delta > 0 ? 'younger' : 'older'}.`}
      </AppText>
      <AppText variant="caption" color="textSecondary" style={styles.gap}>
        Read from {headline.coverage.observed} of {headline.coverage.total} markers. This is not a
        biological age, and it is not a prediction about you.
      </AppText>

      {headline.plusMinusIfComplete < headline.plusMinus ? (
        <View style={[styles.nudge, { borderColor: theme.border }]}>
          <AppText variant="caption" color="textSecondary">
            Measuring the {headline.coverage.total - headline.coverage.observed} you have not done
            would narrow this from give-or-take {headline.plusMinus} to about{' '}
            {headline.plusMinusIfComplete}.
            {untested.length > 0
              ? ` Next: ${untested[0].name.toLowerCase()} — ${untested[0].needs.toLowerCase()}`
              : ''}
          </AppText>
        </View>
      ) : null}

      {progress ? (
        <View style={styles.progress}>
          <AppText variant="label" color="textSecondary">
            Since you started
          </AppText>
          <AppText variant="body" style={styles.gap}>
            {progress.headline}
          </AppText>
          {progress.movements.length > 0 ? (
            <Disclosure title="What moved, and why">
              {progress.movements.map((m) => (
                <View key={m.id} style={styles.movement}>
                  <AppText variant="body">
                    {m.label} — {m.real ? 'changed' : 'measured better'}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {m.detail}
                  </AppText>
                  <AppText variant="caption" color="textTertiary">
                    {m.real
                      ? `Worth ${Math.abs(m.years).toFixed(1)} ${Math.abs(m.years) < 1.05 ? 'year' : 'years'} ${m.years < 0 ? 'better' : 'worse'} on the figure. This one is you.`
                      : `Shifted the figure ${Math.abs(m.years).toFixed(1)} ${Math.abs(m.years) < 1.05 ? 'year' : 'years'} — but that is the instrument knowing more, not you being different.`}
                  </AppText>
                </View>
              ))}
            </Disclosure>
          ) : null}
        </View>
      ) : null}

      {/* The gain, before the studies and before anything else optional.
          For somebody who smokes this is the most useful sentence in the
          app, and putting it under a disclosure would bury the one number
          here that a person can move by a decade. */}
      {opportunities.length > 0 ? (
        <View style={styles.progress}>
          <AppText variant="label" color="textSecondary">
            Where the years are
          </AppText>
          {opportunities.map((c) => (
            <View key={c.id} style={styles.movement}>
              <AppText variant="body">{c.label}</AppText>
              <AppText variant="caption" color="textSecondary">
                {c.opportunity}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <Disclosure title={`The ${reading.observed.length} studies behind this`}>
        {reading.observed.map((c) => (
          <View key={c.id} style={styles.component}>
            <AppText variant="body">
              {c.label} — {c.detail}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {c.source === 'self-reported' ? 'You told us this. ' : ''}
              {c.provenance.study}, {c.provenance.journal}. {c.provenance.sample}.{' '}
              {c.provenance.effect}.
            </AppText>
            {c.upgradeTo ? (
              <AppText variant="caption" color="accent">
                {c.upgradeTo}
              </AppText>
            ) : null}
            {c.opportunity ? (
              <AppText variant="caption" color="accent">
                {c.opportunity}
              </AppText>
            ) : null}
            <AppText variant="caption" color="textTertiary">
              Grade {c.provenance.grade}. {c.provenance.caveat}
            </AppText>
          </View>
        ))}
      </Disclosure>

      <Disclosure title="Why this says provisional">
        <AppText variant="caption" color="textSecondary">
          Every number behind this comes from somebody else&apos;s research — large cohort studies
          that followed tens of thousands of people for years. That is a good deal better than a
          score we invented, and it is still not the same as having been tested on people using this
          app. Until it has been, it says provisional, and the interval beside it is wide on purpose.
        </AppText>
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Every association here is observational: people who score worse tend to die sooner, and
          that is not the same as showing that improving the score changes anything. Some of it runs
          the other way — illness makes people slow and unsteady before it does anything else. This
          is education, not medical advice, and it diagnoses nothing.
        </AppText>
      </Disclosure>

      <View style={styles.actions}>
        <Button
          title={shared ? 'Shared' : 'Share this'}
          variant="secondary"
          hint="Shares the figure along with its margin and what it is based on."
          onPress={async () => {
            // The caveats travel in the body. A number that leaves the app
            // loses its screen, and everything qualifying it with that.
            const out = await shareText(paceShareText(headline), 'My markers');
            if (out.shared) setShared(true);
          }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  hero: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginTop: Spacing.xs },
  number: { fontSize: 56, lineHeight: 64 },
  gap: { marginTop: Spacing.xs },
  nudge: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
  },
  component: { marginTop: Spacing.sm, gap: 2 },
  progress: { marginTop: Spacing.md },
  movement: { marginTop: Spacing.sm, gap: 2 },
  actions: { marginTop: Spacing.md },
});
