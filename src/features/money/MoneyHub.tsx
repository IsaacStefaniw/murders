import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { latest } from '@/features/model/metrics';
import { QuestionCard } from '@/features/model/QuestionCard';
import {
  assessMoney,
  dollars,
  formatMonth,
  monthlyCapacityFrom,
  savingsPlan,
  stepDetail,
} from '@/features/money/plan';
import { addDays, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { Goal } from '@/types/domain';

/**
 * The money hub: the one step under the spotlight, the target with its
 * date, and the weekly number that moves it. Education, never financial
 * advice.
 *
 * The steps themselves are the goal's milestones, listed once further down
 * the screen by the path hub. This card shows only the first one not yet
 * done, so the review's two lists became one.
 */

/** The by-when choices, as months from today. */
const HORIZONS: { label: string; months: number }[] = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
  { label: '3 years', months: 36 },
  { label: '5 years', months: 60 },
];

const SAVED_KEY = /^goal\.[^.]+\.saved$/;

/**
 * A finance goal from the goal wizard with a dollar target: the composer
 * gives it a `goal.<id>.saved` check-in and a rung per fraction. When one
 * exists the hub reads its target from it and the weekly number is written
 * to it, so the goal and the coach never disagree about the same money.
 */
function linkedTarget(goals: Goal[], ownGoalId: string): { goal: Goal; metricKey: string; target: number } | null {
  for (const g of goals) {
    if (g.status !== 'active' || g.id === ownGoalId || g.domain !== 'finance') continue;
    const spec = g.checkins?.find((c) => SAVED_KEY.test(c.metricKey));
    if (!spec) continue;
    const target = Math.max(
      0,
      ...(g.milestones ?? []).map((m) =>
        m.doneWhen?.kind === 'metric' && m.doneWhen.metricKey === spec.metricKey ? m.doneWhen.value : 0,
      ),
    );
    if (target > 0) return { goal: g, metricKey: spec.metricKey, target };
  }
  return null;
}

export function MoneyHub() {
  const theme = useTheme();
  const entry = useAppStore((s) => s.paths.money);
  const goals = useAppStore((s) => s.goals);
  const metrics = useAppStore((s) => s.metrics);
  const addMetric = useAppStore((s) => s.addMetric);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const setMilestoneDone = useAppStore((s) => s.setMilestoneDone);

  const [weekIn, setWeekIn] = useState('');
  const [rateLog, setRateLog] = useState('');
  const [targetText, setTargetText] = useState('');
  const [nowText, setNowText] = useState('');
  const [horizon, setHorizon] = useState<number | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);

  const answers = entry?.answers ?? {};
  const goalId = entry?.goalId ?? '';
  const goal = goals.find((g) => g.id === goalId);

  const linked = useMemo(() => linkedTarget(goals, goalId), [goals, goalId]);
  const savedKey = linked ? linked.metricKey : `goal.${goalId}.saved`;

  const target = linked ? linked.target : Number(answers.target) || 0;
  const byDate = linked ? (linked.goal.targetDate ?? answers.byDate) : answers.byDate;
  const savedNow = latest(metrics, savedKey)?.value ?? (Number(answers.saved) || 0);
  const capacity = useMemo(() => monthlyCapacityFrom(metrics), [metrics]);

  const plan = useMemo(
    () =>
      target > 0 && byDate
        ? savingsPlan({ target, byDate, startingBalance: savedNow, monthlyCapacity: capacity })
        : null,
    [target, byDate, savedNow, capacity],
  );
  const nextMilestone = plan?.milestones.find((m) => !m.reached);

  const nextStep = goal?.milestones?.find((m) => !m.done);
  const assessment = useMemo(() => assessMoney(metrics), [metrics]);

  const logWeek = () => {
    const n = Number(weekIn);
    if (!Number.isFinite(n) || n < 0) return;
    const total = savedNow + n;
    addMetric('finance.weeklyIn', n);
    addMetric(savedKey, total);
    if (!linked) updatePathAnswers('money', { saved: String(total) });
    setWeekIn('');
  };

  const saveTarget = () => {
    const amount = Number(targetText);
    if (!Number.isFinite(amount) || amount <= 0 || horizon === null) return;
    const date = addDays(todayKey(), Math.round(horizon * 30.4375));
    const now = Math.max(0, Number(nowText) || 0);
    updatePathAnswers('money', { target: String(amount), byDate: date, saved: String(now) });
    if (goalId) {
      updateGoal(goalId, { targetDate: date });
      addMetric(savedKey, now);
    }
    setTargetText('');
    setNowText('');
    setHorizon(null);
    setEditingTarget(false);
  };

  const showTargetForm = !linked && (target <= 0 || !byDate || editingTarget);

  return (
    <View>
      {nextStep ? (
        <>
          <SectionHeader title="This is the step" />
          <Card style={{ borderColor: theme.accent }}>
            <AppText variant="heading">{nextStep.title}</AppText>
            {stepDetail(nextStep.title) ? (
              <AppText variant="caption" color="textTertiary" style={styles.detail}>
                {stepDetail(nextStep.title)}
              </AppText>
            ) : null}
            <Button
              title="Done, next step"
              variant="secondary"
              onPress={() => goal && setMilestoneDone(goal.id, nextStep.id, true)}
              style={styles.cardButton}
            />
          </Card>
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            One at a time, in the order the maths supports. The rest of your steps are listed below.
          </AppText>
        </>
      ) : null}

      <SectionHeader title="Your target" />
      {showTargetForm ? (
        <Card>
          <AppText variant="body">How much, by when, and what is there now?</AppText>
          <View style={styles.inputRow}>
            <Field
              label="Target amount in dollars"
              showLabel={false}
              value={targetText}
              onChangeText={setTargetText}
              keyboardType="numeric"
              placeholder="$ target"
              width={120}
            />
            <Field
              label="Amount there now in dollars"
              showLabel={false}
              value={nowText}
              onChangeText={setNowText}
              keyboardType="numeric"
              placeholder="$ there now"
              width={120}
            />
          </View>
          <View style={styles.chips}>
            {HORIZONS.map((h) => (
              <Chip
                key={h.months}
                label={h.label}
                selected={horizon === h.months}
                onPress={() => setHorizon(h.months)}
              />
            ))}
          </View>
          <View style={styles.inputRow}>
            <Button
              title="Work out the monthly amount"
              disabled={!(Number(targetText) > 0) || horizon === null}
              onPress={saveTarget}
            />
            {editingTarget ? (
              <Button title="Keep the old one" variant="ghost" onPress={() => setEditingTarget(false)} />
            ) : null}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            People who write a specific amount and a date save more than people who mean to. The
            monthly figure is arithmetic on your numbers, with no interest assumed.
          </AppText>
        </Card>
      ) : plan && byDate ? (
        <Card style={plan.onTrack === false ? null : { borderColor: theme.accent }}>
          <AppText variant="heading">
            {dollars(target)} by {formatMonth(byDate)}
          </AppText>
          <AppText variant="body" style={styles.detail}>
            {plan.sentence}
          </AppText>
          <AppText variant="caption" color="textTertiary" style={styles.detail}>
            {dollars(savedNow)} there now
            {nextMilestone
              ? ` · next: ${nextMilestone.title.toLowerCase()}, ${dollars(nextMilestone.amount)}${
                  nextMilestone.date ? ` by ${formatMonth(nextMilestone.date)}` : ''
                }`
              : ''}
          </AppText>
          {linked ? (
            <AppText variant="caption" color="textTertiary" style={styles.detail}>
              Read from your goal “{linked.goal.title}”.
            </AppText>
          ) : (
            <Button
              title="Change the target"
              variant="ghost"
              onPress={() => setEditingTarget(true)}
              style={styles.cardButton}
            />
          )}
        </Card>
      ) : null}

      <SectionHeader title="This week" />
      <Card>
        <AppText variant="body">What went in this week?</AppText>
        <View style={styles.inputRow}>
          <Field
            label="Dollars put away this week"
            showLabel={false}
            value={weekIn}
            onChangeText={setWeekIn}
            keyboardType="numeric"
            placeholder="$"
            width={100}
          />
          <Button
            title="Log this week"
            variant="secondary"
            disabled={weekIn.trim() === '' || !(Number(weekIn) >= 0)}
            onPress={logWeek}
          />
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.hint}>
          {capacity !== undefined
            ? `About ${dollars(capacity)} a month at the recent pace. Zero is an honest answer; the trend is what the coach reads.`
            : 'One number, once a week. Zero is an honest answer; the trend is what the coach reads.'}
        </AppText>
      </Card>

      <SectionHeader title="Once a month, if you know it" />
      <Card style={styles.row}>
        <AppText variant="body" style={styles.grow}>
          Share of income kept last month
        </AppText>
        <AppText variant="heading">
          {assessment.trend
            ? `${assessment.trend.from}% → ${assessment.trend.to}%`
            : assessment.rate != null
              ? `${assessment.rate}%`
              : '—'}
        </AppText>
      </Card>
      <View style={styles.inputRow}>
        <Field
          label="Last month's savings rate, as a percentage"
          showLabel={false}
          value={rateLog}
          onChangeText={setRateLog}
          keyboardType="numeric"
          placeholder="%"
          width={84}
        />
        <Button
          title="Log last month's rate"
          variant="secondary"
          disabled={!Number(rateLog)}
          onPress={() => {
            addMetric('finance.savingsRate', Number(rateLog));
            setRateLog('');
          }}
        />
      </View>
      <Card
        style={{
          marginTop: Spacing.md,
          borderColor: assessment.verdict === 'on-track' ? theme.accent : theme.border,
        }}
      >
        <AppText variant="body">{assessment.message}</AppText>
      </Card>

      {/* After the program, never above it: the review found this card
          asking a question over a program that had just been built. */}
      <QuestionCard domain="finance" />

      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        Educational structure, never financial advice. Where the money sits and what it goes into
        are questions for a licensed adviser.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  detail: { marginTop: Spacing.xs },
  cardButton: { marginTop: Spacing.md },
  hint: { marginTop: Spacing.sm },
});
