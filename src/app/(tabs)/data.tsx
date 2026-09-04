/**
 * Data — where everything measured actually shows up.
 *
 * Isaac asked for this directly ("the app needs a data and charts
 * section"), and until now the app measured a great deal and displayed
 * almost none of it: metrics fed milestone evidence and disappeared.
 *
 * The order is deliberate. Projections first, because "at this rate you
 * arrive in March and you said January" is the one thing here that changes
 * what someone does today. Then the numbers themselves, then the shape of
 * the weeks. Nothing on this screen scores the person: no adherence
 * percentage, no streak, no grade. Counts and directions only.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BarChart, DotGrid, MetricRow, Sparkbars } from '@/components/charts';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { protocolById } from '@/features/knowledge/protocols';
import { computeCohortMetrics, shareableSummary } from '@/features/analytics/cohort';
import { BodyNumbers } from '@/features/health/BodyNumbers';
import { WeeklyReviewPanel } from '@/features/review/WeeklyReviewPanel';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { behaviourPattern } from '@/features/behaviours/patterns';
import { METRICS } from '@/features/model/metrics';
import { allTrajectories, type Verdict } from '@/features/model/trajectory';
import { recentLogs, weeklyVolume } from '@/features/training/log';
import { addDays, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import { LockedCard } from '@/features/plus/Locked';

/** How the verdict reads at a glance. Never a grade — a direction. */
const VERDICT_COLOR: Record<Verdict, 'accent' | 'success' | 'textSecondary' | 'textTertiary'> = {
  behind: 'accent',
  'wrong-way': 'accent',
  flat: 'textSecondary',
  'on-track': 'success',
  ahead: 'success',
  arrived: 'success',
  'not-enough-data': 'textTertiary',
};

const VERDICT_LABEL: Record<Verdict, string> = {
  behind: 'Behind the date',
  'wrong-way': 'Going the other way',
  flat: 'Not moving',
  'on-track': 'On pace',
  ahead: 'Ahead of the date',
  arrived: 'Reached',
  'not-enough-data': 'Still learning',
};

export default function Data() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const plus = useAppStore((s) => s.entitlement.plus);
  const goals = useAppStore((s) => s.goals);
  const metrics = useAppStore((s) => s.metrics);
  const plans = useAppStore((s) => s.plans);
  const [shared, setShared] = useState(false);
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);

  const today = todayKey();
  const cohort = useMemo(
    () => computeCohortMetrics(profile, plans, today),
    [profile, plans, today],
  );

  const trajectories = useMemo(() => allTrajectories(goals, metrics), [goals, metrics]);

  /** Metrics with enough readings to be worth drawing, most-recent first. */
  const tracked = useMemo(() => {
    return METRICS.map((def) => {
      const readings = metrics
        .filter((m) => m.key === def.key)
        .sort((a, b) => a.at.localeCompare(b.at))
        .slice(-24);
      return { def, readings };
    }).filter((m) => m.readings.length >= 2);
  }, [metrics]);

  /**
   * Consistency, practice by practice.
   *
   * "Your numbers" charts things that move — a lift, a weight, a savings
   * rate. Most of what the app asks for is not like that: a wind-down, a
   * morning walk, protein at breakfast. Their value is the count, and
   * before this they had nowhere to be seen at all, so someone could hold a
   * practice for a month and the app would show them nothing for it.
   */
  const practices = useMemo(() => {
    const since = addDays(today, -27);
    const counts = new Map<string, number>();
    for (const m of metrics) {
      if (!m.key.startsWith('practice.')) continue;
      if (m.at.slice(0, 10) < since) continue;
      counts.set(m.key, (counts.get(m.key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        title: protocolById(key.slice('practice.'.length))?.title ?? key.slice('practice.'.length),
      }))
      .sort((a, b) => b.count - a.count);
  }, [metrics, today]);

  /** Last 28 days: did anything from the plan get done? */
  const adherenceDays = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const date = addDays(today, i - 27);
      const items = (plans[date]?.items ?? []).filter((it) => !it.fixed);
      return { done: items.some((it) => it.status === 'completed'), label: date };
    });
  }, [plans, today]);

  const volume = useMemo(() => weeklyVolume(workoutLogs, 8), [workoutLogs]);
  const sessions = useMemo(() => recentLogs(workoutLogs), [workoutLogs]);
  const activeIntentions = behaviourIntentions.filter((b) => b.active);

  if (!profile) return <Screen tabbed />;

  const nothingYet =
    trajectories.length === 0 && tracked.length === 0 && workoutLogs.length === 0;

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Progress
      </AppText>
      <AppText variant="title">What the numbers say</AppText>

      {nothingYet ? (
        <EmptyState
          title="Nothing measured yet"
          message="Log a workout, answer a check-in, or connect Apple Health. Readings show up here as they arrive — and once there are a few weeks of them, so does where they are heading."
          actionTitle="Open today"
          onAction={() => router.push('/(tabs)/today')}
        />
      ) : null}

      {trajectories.length > 0 && !plus ? (
        <>
          <SectionHeader title="Where this is heading" />
          <LockedCard
            title={`${trajectories.length} ${trajectories.length === 1 ? 'projection' : 'projections'} from your own numbers`}
            body="At this rate, when you arrive — and what would change it. Plus works it out from what you log."
          />
        </>
      ) : null}
      {trajectories.length > 0 && plus ? (
        <>
          <SectionHeader title="Where this is heading" />
          <View style={styles.stack}>
            {trajectories.map(({ goal, trajectory }) => (
              <Card key={goal.id}>
                <View style={styles.row}>
                  <AppText variant="heading" style={styles.grow}>
                    {goal.title}
                  </AppText>
                  <AppText variant="caption" color={VERDICT_COLOR[trajectory.verdict]}>
                    {VERDICT_LABEL[trajectory.verdict]}
                  </AppText>
                </View>
                <AppText variant="secondary" style={styles.gap}>
                  {trajectory.headline}
                </AppText>
                {trajectory.gapNote ? (
                  <AppText variant="caption" color="textTertiary" style={styles.gap}>
                    {trajectory.gapNote}
                  </AppText>
                ) : null}
                <AppText variant="caption" color="textTertiary" style={styles.gap}>
                  {trajectory.label}: {trajectory.current} {trajectory.unit} now, target{' '}
                  {trajectory.target} {trajectory.unit}
                  {trajectory.verdict === 'not-enough-data'
                    ? ''
                    : ` · ${trajectory.readings} readings over ${trajectory.spanDays} days`}
                </AppText>
              </Card>
            ))}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.note}>
            Projections are a straight line through your readings, nothing cleverer. They move as
            the readings do.
          </AppText>
        </>
      ) : null}

      {tracked.length > 0 ? (
        <>
          <SectionHeader title="Your numbers" />
          <Card>
            {tracked.map(({ def, readings }, i) => {
              const first = readings[0].value;
              const last = readings[readings.length - 1].value;
              const change = Math.round((last - first) * 10) / 10;
              const better =
                def.direction === 'higher'
                  ? change > 0
                  : def.direction === 'lower'
                    ? change < 0
                    : false;
              return (
                <View key={def.key} style={i > 0 ? styles.divider : undefined}>
                  <MetricRow
                    label={def.label}
                    value={`${last} ${def.unit}`}
                    delta={change === 0 ? 'unchanged' : `${change > 0 ? '+' : ''}${change} ${def.unit}`}
                    deltaGood={better}
                    note={`${readings.length} readings`}
                    data={readings.map((r) => ({ value: r.value }))}
                  />
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {workoutLogs.length > 0 ? (
        <>
          <SectionHeader title="Training" />
          <Card>
            <AppText variant="body">Weekly volume</AppText>
            <AppText variant="caption" color="textTertiary">
              Kilograms moved — sets times reps times load. Bodyweight work is not counted, which
              is why a hard session can show as a short bar.
            </AppText>
            <View style={styles.gap}>
              <BarChart
                data={volume.map((w) => ({
                  value: w.volume,
                  label: w.weekStart.slice(5).replace('-', '/'),
                }))}
                format={(n) => `${Math.round(n).toLocaleString()} kg`}
              />
            </View>
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {sessions.length} sessions in the last eight weeks.
            </AppText>
          </Card>
        </>
      ) : null}

      {practices.length > 0 ? (
        <>
          <SectionHeader title="Practices you kept" />
          <Card>
            <AppText variant="caption" color="textTertiary">
              Times completed in the last 28 days. Counts, not scores — a practice you did nine
              times is not a nine out of ten at anything.
            </AppText>
            <View style={styles.gap}>
              <BarChart
                data={practices.slice(0, 8).map((p) => ({ value: p.count, label: p.title }))}
                format={(n) => `${n}\u00d7`}
              />
            </View>
          </Card>
        </>
      ) : null}

      <BodyNumbers />

      <SectionHeader title="The shape of the month" />
      <Card>
        <AppText variant="body">Days something got done</AppText>
        <AppText variant="caption" color="textTertiary">
          Last 28 days, oldest first. Not a streak — a missed Tuesday is a missed Tuesday, not a
          reset to zero.
        </AppText>
        <View style={styles.gap}>
          <DotGrid
            days={adherenceDays}
            accessibilityLabel={`${adherenceDays.filter((d) => d.done).length} of the last 28 days had something completed`}
          />
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          {adherenceDays.filter((d) => d.done).length} of 28.
        </AppText>
      </Card>

      {activeIntentions.length > 0 ? (
        <>
          <SectionHeader title="Patterns" />
          <View style={styles.stack}>
            {activeIntentions.map((intention) => {
              const pattern = behaviourPattern(intention, behaviourEvents, metrics);
              const info = behaviourInfo(intention.behaviour);
              return (
                <Card key={intention.id}>
                  <AppText variant="body">{info.label}</AppText>
                  {pattern.readiness === 'learning' ? (
                    <AppText variant="caption" color="textTertiary">
                      {pattern.needed} more logged and the timing shows.
                    </AppText>
                  ) : (
                    <>
                      <AppText variant="caption" color="textTertiary">
                        Usually {pattern.window?.label}
                        {pattern.days.label ? `, mostly ${pattern.days.label}` : ''}.
                      </AppText>
                      {pattern.intervention ? (
                        <AppText variant="caption" color="accent" style={styles.gap}>
                          Best moment to change the evening: {pattern.intervention.at}
                        </AppText>
                      ) : null}
                    </>
                  )}
                  {pattern.events > 0 ? (
                    <View style={styles.gap}>
                      <Sparkbars
                        data={[pattern.week.priorMean, pattern.week.thisWeek].map((v) => ({
                          value: v,
                        }))}
                        height={20}
                        fromZero
                        accessibilityLabel="Last weeks against this week"
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </>
      ) : null}

      <WeeklyReviewPanel />

      {/*
        How it is actually going, for the person and for the product.

        Every figure is arithmetic over plans already on this device — no
        events, no SDK, no network. That is why there is nothing to opt out
        of, and why these numbers describe the weeks already lived rather
        than starting from zero the day measurement was added.

        Sending them is a deliberate act, not a background upload.
      */}
      {cohort && cohort.daysSince >= 7 ? (
        <>
          <SectionHeader title="How it's going" />
          <Card style={styles.stack}>
            <Stat label="Days using IntentNorth" value={String(cohort.daysSince)} />
            <Stat
              label="Plans you kept"
              value={
                cohort.completionRate === null
                  ? '—'
                  : `${Math.round(cohort.completionRate * 100)}%`
              }
            />
            <Stat label="Weeks in a row with something done" value={String(cohort.activeWeekStreak)} />
            {cohort.daysToFirstWin !== null ? (
              <Stat label="Days to your first win" value={String(cohort.daysToFirstWin)} />
            ) : null}
            <AppText variant="caption" color="textTertiary">
              Worked out on this phone from your own plans. Nothing was tracked and nothing was
              sent — if you want to tell us how it is going, the button below copies these
              numbers and nothing else.
            </AppText>
            <Button
              title={shared ? 'Copied ✓' : 'Copy my numbers'}
              variant="secondary"
              onPress={async () => {
                try {
                  await navigator.clipboard.writeText(
                    shareableSummary(cohort, profile?.weekShape),
                  );
                  setShared(true);
                  setTimeout(() => setShared(false), 2000);
                } catch {
                  // Clipboard unavailable — nothing here is load-bearing.
                }
              }}
            />
          </Card>
        </>
      ) : null}

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Every number here came from something you did or something your phone measured. Nothing is
        estimated on your behalf, and nothing here is a score.
      </AppText>
    </Screen>
  );
}

/** One label-and-number line. Plain on purpose: these are facts, not charts. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statLine}>
      <AppText variant="body" style={styles.grow}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  statLine: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.md },
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  grow: { flexShrink: 1 },
  gap: { marginTop: Spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)' },
  note: { marginTop: Spacing.lg },
});
