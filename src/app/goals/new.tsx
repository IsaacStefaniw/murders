import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  askCheckin,
  composeGoalDraft,
  describeCheckin,
  describeStep,
  formatDay,
  paceLanding,
} from '@/features/goals/composer';
import { DOMAIN_LABELS, parseGoal, timeframeToDate } from '@/features/goals/goalPlanner';
import { PRESET_GROUPS } from '@/features/goals/presets';
import { DOMAIN_QUESTIONS } from '@/features/knowledge/questionBank';
import { addDays, formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const HORIZONS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
];

/**
 * Conversational goal creation: the user writes one sentence, IntentNorth does
 * the structuring — domain, steps, the recurring behaviour — and asks
 * only what it genuinely needs (the why, and for a savings goal the two
 * numbers the steps are worked out from). The user edits and approves.
 */
export default function NewGoal() {
  const router = useRouter();
  const addGoal = useAppStore((s) => s.addGoal);
  const addMetric = useAppStore((s) => s.addMetric);
  const profile = useAppStore((s) => s.profile);
  const metrics = useAppStore((s) => s.metrics);

  const [step, setStep] = useState<'describe' | 'why' | 'tailor' | 'review'>('describe');
  const [text, setText] = useState('');
  const [why, setWhy] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Dropped steps are remembered by title: the draft is rebuilt when the
  // date changes and every step gets a fresh id.
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  /**
   * Optional, and offered as a horizon rather than a date field. Plenty of
   * goals are directions rather than deadlines, and a required date would
   * manufacture a failure nobody signed up for — but where one exists,
   * every step gets its own date and the app can say where the current
   * rate lands, which is the most useful sentence it knows how to produce.
   * `undefined` means not chosen yet, so a date in the sentence is used.
   */
  const [targetDate, setTargetDate] = useState<string | null | undefined>(undefined);

  const today = todayKey();
  const parsed = useMemo(() => (text.trim() ? parseGoal(text) : null), [text]);
  const sentenceDate = useMemo(
    () => (parsed ? timeframeToDate(parsed.timeframe, today) : undefined),
    [parsed, today],
  );
  const effectiveDate = targetDate === undefined ? (sentenceDate ?? null) : targetDate;
  const questions = parsed ? (DOMAIN_QUESTIONS[parsed.domain] ?? []) : [];
  const moneyNumbers = parsed?.domain === 'finance' && answers.mode !== 'debt';
  const plan = useMemo(
    () =>
      parsed && step === 'review'
        ? composeGoalDraft(parsed, profile, why, answers, {
            today,
            targetDate: effectiveDate ?? undefined,
            metrics,
          })
        : null,
    [parsed, step, profile, why, answers, today, effectiveDate, metrics],
  );
  const afterWhy = () => setStep(questions.length > 0 || moneyNumbers ? 'tailor' : 'review');

  const landing = plan ? paceLanding(plan.goal, metrics, today) : null;

  const save = () => {
    if (!plan) return;
    const milestones = plan.goal.milestones?.filter((m) => !dropped.has(m.title));
    addGoal(
      {
        ...plan.goal,
        why: why.trim() || undefined,
        milestones: milestones?.length ? milestones : undefined,
      },
      plan.routines,
    );
    // Where they are today is the first reading, so the check-in has a
    // starting point and the landing line has something to measure from.
    const ask = askCheckin(plan.goal);
    const saved = Number(answers.saved);
    if (ask && saved > 0) addMetric(ask.metricKey, saved, 'starting point');
    router.back();
  };

  if (step === 'describe') {
    return (
      <Screen>
        <AppText variant="title">What do you want?</AppText>
        <AppText variant="secondary" style={styles.sub}>
          One sentence. I&apos;ll do the structuring.
        </AppText>
        <Field
          label="What do you want to be true?"
          showLabel={false}
          hint="Describe the goal in your own words, with a date if you have one. IntentNorth reads it and drafts the steps to get there."
          value={text}
          onChangeText={setText}
          placeholder="e.g. Save $100,000 by June 2028"
          autoFocus
          multiline
          size="large"
        />
        {parsed ? (
          <AppText variant="caption" color="textTertiary" style={styles.sub}>
            Reading this as: {DOMAIN_LABELS[parsed.domain]}
            {parsed.target ? ` · target ${parsed.target}` : ''}
            {sentenceDate ? ` · by ${formatDay(sentenceDate)}` : parsed.timeframe ? ` · ${parsed.timeframe}` : ''}
          </AppText>
        ) : null}
        {/*
          The shelf. A blank box asks someone to be articulate about their
          own life before anything has been given to them, and the honest
          answer at that moment is usually "I don't know, better?".
          Recognition is a far easier act than composition.

          A preset is only the sentence they would have typed — it fills
          the box and goes through the same parser, so it can never drift
          from what typing produces.
        */}
        {text.trim().length === 0 ? (
          <View style={styles.presets}>
            <AppText variant="caption" color="textTertiary">
              Or start from one of these — each one fills the box above, and you can edit it.
            </AppText>
            {PRESET_GROUPS.map((group) => (
              <View key={group.title} style={styles.presetGroup}>
                <AppText variant="label" color="textSecondary">
                  {group.title}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {group.blurb}
                </AppText>
                <View style={styles.chipsRow}>
                  {group.presets.map((preset) => (
                    <Chip
                      key={preset.id}
                      label={preset.label}
                      hint={preset.commitment}
                      onPress={() => setText(preset.text)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <Button title="Continue" disabled={text.trim().length < 4} onPress={() => setStep('why')} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (step === 'why') {
    return (
      <Screen>
        <AppText variant="title">Why does this matter enough to make room for it?</AppText>
        <AppText variant="secondary" style={styles.sub}>
          Your words. When motivation dips, they&apos;ll do the arguing.
        </AppText>
        <Field
          label="Why this matters"
          showLabel={false}
          hint="Optional. Shown back to you on the days motivation dips."
          value={why}
          onChangeText={setWhy}
          placeholder="Optional — but the goals with a why are the ones that happen"
          autoFocus
          multiline
          size="large"
        />
        <View style={styles.footer}>
          <Button title={why.trim() ? 'Continue' : 'Skip'} onPress={afterWhy} />
          <Button title="Back" variant="ghost" onPress={() => setStep('describe')} />
        </View>
      </Screen>
    );
  }

  if (step === 'tailor') {
    // Evidence-based intake: every answer changes the plan that gets built.
    return (
      <Screen>
        <AppText variant="label" color="accent">
          {parsed ? DOMAIN_LABELS[parsed.domain] : ''}
        </AppText>
        <AppText variant="title">A couple of questions, then the plan.</AppText>
        {questions.map((q) => (
          <View key={q.key}>
            <SectionHeader title={q.question} />
            <View style={styles.chipsRow}>
              {q.options.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={answers[q.key] === o.value}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.key]: o.value }))}
                />
              ))}
            </View>
          </View>
        ))}
        {moneyNumbers ? (
          <View>
            {/* The two numbers the steps are worked out from. Both optional:
                without them the steps are quarter marks from zero. */}
            <SectionHeader title="Where are you starting from?" />
            <Field
              label="Already set aside"
              hint="Optional. The first steps start from here, and this becomes your first reading."
              value={answers.saved ?? ''}
              onChangeText={(v) => setAnswers((prev) => ({ ...prev, saved: v.replace(/[^\d.]/g, '') }))}
              keyboardType="decimal-pad"
              unit="$"
              placeholder="0"
              width={140}
            />
            <Field
              label="A month of expenses, roughly"
              hint="Optional. Gives you a step at one month banked — the first buffer that turns an emergency back into an inconvenience."
              value={answers.expenses ?? ''}
              onChangeText={(v) => setAnswers((prev) => ({ ...prev, expenses: v.replace(/[^\d.]/g, '') }))}
              keyboardType="decimal-pad"
              unit="$"
              placeholder="0"
              width={140}
              style={styles.sub}
            />
          </View>
        ) : null}
        <View style={styles.footer}>
          <Button
            title={questions.every((q) => answers[q.key]) ? 'Build my plan' : 'Skip — use defaults'}
            onPress={() => setStep('review')}
          />
          <Button title="Back" variant="ghost" onPress={() => setStep('why')} />
        </View>
      </Screen>
    );
  }

  if (!plan) return <Screen />;

  return (
    <Screen>
      <AppText variant="label" color="accent">
        {DOMAIN_LABELS[plan.goal.domain ?? 'personal']}
      </AppText>
      <AppText variant="title">{plan.goal.title}</AppText>
      {why.trim() ? (
        <AppText variant="secondary" style={styles.sub}>
          Because: {why.trim()}
        </AppText>
      ) : null}

      <SectionHeader title="By when?" />
      <AppText variant="caption" color="textTertiary">
        With a date, every step gets one and IntentNorth can say where your rate lands. Without
        one it still tracks everything, it just has no date to measure against.
      </AppText>
      <View style={styles.horizons}>
        {sentenceDate ? (
          <Chip
            label={`From what you wrote: ${formatDay(sentenceDate)}`}
            selected={effectiveDate === sentenceDate}
            onPress={() => setTargetDate(sentenceDate)}
          />
        ) : null}
        {HORIZONS.map((h) => {
          const date = addDays(today, Math.round(h.months * 30.44));
          return (
            <Chip
              key={h.months}
              label={h.label}
              selected={effectiveDate === date}
              onPress={() => setTargetDate(date)}
            />
          );
        })}
        <Chip label="No date" selected={effectiveDate === null} onPress={() => setTargetDate(null)} />
      </View>
      {landing || plan.goal.pace?.note ? (
        <Card style={styles.sub}>
          {landing ? <AppText variant="secondary">{landing.headline}</AppText> : null}
          {plan.goal.pace?.note ? (
            <AppText variant="caption" color="textTertiary" style={styles.sub}>
              {plan.goal.pace.note}
            </AppText>
          ) : null}
        </Card>
      ) : null}

      {plan.goal.milestones?.length ? (
        <View>
          <SectionHeader title="Steps to get there" />
          <View style={styles.stack}>
            {plan.goal.milestones.map((m) => {
              const out = dropped.has(m.title);
              return (
                <Card key={m.id}>
                  <View style={styles.stepHead}>
                    <AppText variant="heading" color={out ? 'textTertiary' : undefined} style={styles.grow}>
                      {m.title}
                    </AppText>
                    <Chip
                      label={out ? 'Put back' : 'Drop'}
                      selected={out}
                      hint={out ? 'Keeps this step in the plan' : 'Leaves this step out of the plan'}
                      onPress={() =>
                        setDropped((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.title)) {
                            next.delete(m.title);
                          } else {
                            next.add(m.title);
                          }
                          return next;
                        })
                      }
                    />
                  </View>
                  {out ? null : (
                    <View style={styles.stepLines}>
                      <AppText variant="caption" color="textTertiary">
                        {describeStep(m)}
                      </AppText>
                      {m.how ? (
                        <AppText variant="caption" color="textSecondary">
                          How: {m.how}
                        </AppText>
                      ) : null}
                      {m.intention ? (
                        <AppText variant="caption" color="textSecondary">
                          {m.intention}
                        </AppText>
                      ) : null}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.sub}>
            Steps backed by a number tick themselves — you only confirm what a number can&apos;t see.
          </AppText>
        </View>
      ) : null}

      {plan.goal.checkins?.length ? (
        <View>
          <SectionHeader title="How I’ll track it" />
          <Card>
            {plan.goal.checkins.map((c) => (
              <AppText key={c.id} variant="body">
                {describeCheckin(c)}
              </AppText>
            ))}
          </Card>
        </View>
      ) : null}

      <SectionHeader title="The behaviour that makes it real" />
      {plan.routines.length === 0 ? (
        <Card>
          <AppText variant="body">
            This one runs through the urge tool rather than the calendar — add it under
            Settings → behaviours, and IntentNorth will help you protect against it daily.
          </AppText>
        </Card>
      ) : (
        <View style={styles.stack}>
          {plan.routines.map((r) => (
            <Card key={r.id}>
              <AppText variant="heading">{r.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {r.days.length === 7 ? 'Every day' : r.days.map((d) => DAY_LETTERS[d]).join(' ')}
                {' · around '}
                {formatTime(r.preferredStart)} · {r.durationMin} min
                {r.duringWork ? ' · carved out of work hours' : ''}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Button title="Make it real" onPress={save} />
        <Button
          title="Back"
          variant="ghost"
          onPress={() => setStep(questions.length > 0 || moneyNumbers ? 'tailor' : 'why')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: Spacing.sm },
  presets: { marginTop: Spacing.xl, gap: Spacing.lg },
  presetGroup: { gap: Spacing.sm },
  stack: { flexDirection: 'column', gap: Spacing.sm },
  stepHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  stepLines: { marginTop: Spacing.xs, gap: Spacing.xs },
  grow: { flexShrink: 1, flexGrow: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  horizons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
