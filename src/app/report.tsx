import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { computeCohortMetrics } from '@/features/analytics/cohort';
import { selfComparison } from '@/features/analytics/comparison';
import { recentRecords } from '@/features/model/metrics';
import { buildWeekReport } from '@/features/review/weekReport';
import { formatDateLong, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import { LockedCard } from '@/features/plus/Locked';

const AREA_LABELS: Record<string, string> = {
  family: 'Family',
  relationship: 'Relationship',
  health: 'Health',
  work: 'Work',
  growth: 'Growth',
  enjoyment: 'Enjoyment',
  admin: 'Money & admin',
};

/** The week's evidence: what happened, what moved, what carried it. */
export default function WeekReportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const today = todayKey();
  const plans = useAppStore((s) => s.plans);
  const goals = useAppStore((s) => s.goals);
  const metrics = useAppStore((s) => s.metrics);
  const profile = useAppStore((s) => s.profile);
  const plus = useAppStore((s) => s.entitlement.plus);
  const report = useMemo(() => buildWeekReport(today, plans, goals), [today, plans, goals]);
  const records = useMemo(() => recentRecords(metrics, 7), [metrics]);
  /**
   * How this week sits against this person's own history.
   *
   * The week in progress is dropped before comparing. Half a week measured
   * against whole ones reports a decline every Monday morning, which is
   * both wrong and the single most discouraging moment to be wrong at.
   */
  const comparison = useMemo(() => {
    const cohort = computeCohortMetrics(profile, plans, today);
    if (!cohort) return null;
    const complete = cohort.weeks.filter((w) => w.to <= today);
    return selfComparison(complete);
  }, [profile, plans, today]);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/data' as never));

  if (!plus) {
    return (
      <Screen>
        <View style={styles.topRow}>
          <AppText variant="label" color="textTertiary" style={styles.grow}>
            Weekly report
          </AppText>
          <Button title="Done" variant="ghost" onPress={close} />
        </View>
        <AppText variant="title">Your week, in evidence</AppText>
        <AppText variant="secondary" style={styles.sub}>
          What happened this week against your own weeks — done, moved, kept, and what changed.
        </AppText>
        <LockedCard title="The weekly report" body="Seven days at a time, compared with nobody but you." />
      </Screen>
    );
  }

  const rate = report.planned > 0 ? Math.round((report.done / report.planned) * 100) : 0;

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Weekly report
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Your week, in evidence</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Rolling seven days to {formatDateLong(report.to)}. No grades — just what happened.
      </AppText>

      <View style={styles.statRow}>
        <Card style={styles.stat}>
          <AppText variant="title">{report.done}</AppText>
          <AppText variant="caption" color="textTertiary">
            things done
          </AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title">{report.milestonesMoved.length}</AppText>
          <AppText variant="caption" color="textTertiary">
            milestones moved
          </AppText>
        </Card>
        <Card style={styles.stat}>
          <AppText variant="title">{report.planned > 0 ? `${rate}%` : '—'}</AppText>
          <AppText variant="caption" color="textTertiary">
            of plans kept
          </AppText>
        </Card>
      </View>

      {comparison?.line ? (
        <Card style={styles.compare}>
          <AppText variant="body">{comparison.line}</AppText>
          {comparison.yourAverage !== null ? (
            <AppText variant="caption" color="textTertiary">
              Compared with your own weeks — nobody else&apos;s. Your usual is{' '}
              {Math.round(comparison.yourAverage * 10) / 10} a week
              {comparison.firstWeek !== null ? `, and your first week was ${comparison.firstWeek}` : ''}
              .
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {records.length > 0 ? (
        <View>
          <SectionHeader title="Personal records 🏅" />
          <View style={styles.stack}>
            {records.map((r) => (
              <Card key={r.def.key}>
                <AppText variant="body">
                  {r.def.label}: {r.value} {r.def.unit} — new best
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {report.milestonesMoved.length > 0 ? (
        <View>
          <SectionHeader title="Goals that moved" />
          <View style={styles.stack}>
            {report.milestonesMoved.map((m, i) => (
              <Card key={i}>
                <AppText variant="body">✓ {m.milestone}</AppText>
                <AppText variant="caption" color="textTertiary">
                  {m.goalTitle}
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {report.topWins.length > 0 ? (
        <View>
          <SectionHeader title="What carried the week" />
          <View style={styles.stack}>
            {report.topWins.map((w) => (
              <Card key={w.title}>
                <AppText variant="body">
                  {w.title} · {w.count}×
                </AppText>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {report.byArea.length > 0 ? (
        <View>
          <SectionHeader title="Where the week went" />
          <Card>
            {report.byArea.map((a) => (
              <AppText key={a.area} variant="secondary">
                {AREA_LABELS[a.area] ?? a.area}: {a.done}
              </AppText>
            ))}
            {report.bestDay ? (
              <AppText variant="caption" color="success" style={styles.best}>
                Best day: {formatDateLong(report.bestDay.date)} — {report.bestDay.done} done
              </AppText>
            ) : null}
          </Card>
        </View>
      ) : (
        <Card style={{ marginTop: Spacing.lg, borderColor: theme.border }}>
          <AppText variant="secondary">
            Nothing recorded yet this week. Live a few days with the plan and this page starts
            earning its place.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  compare: { marginTop: Spacing.lg, gap: Spacing.xs },
  statRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  stack: { gap: Spacing.sm },
  best: { marginTop: Spacing.sm },
});
